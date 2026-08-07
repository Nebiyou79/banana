const { createUser, signToken } = require('../../helpers/auth');
const Conversation = require('../../../src/models/Conversation');
const { startSocketServer, connectClient, stopSocketServer } = require('../../helpers/socket');

describe('chatSocket integration', () => {
  beforeAll(async () => {
    await startSocketServer();
  });

  afterAll(async () => {
    await stopSocketServer();
  });

  async function connectUser(user) {
    const client = connectClient(signToken(user._id));
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('connect timeout')), 5000);
      client.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      client.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    return client;
  }

  it('allows participant to join conversation room', async () => {
    const userA = await createUser();
    const userB = await createUser();
    const conversation = await Conversation.create({
      participants: [userA._id, userB._id],
      status: 'active',
    });

    const client = await connectUser(userA);

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('join_room timeout')), 5000);
      client.emit('chat:join_room', { conversationId: conversation._id.toString() });
      setTimeout(() => {
        clearTimeout(timeout);
        resolve();
      }, 300);
    });

    client.close();
  });

  it('emits typing indicator to other participants', async () => {
    const userA = await createUser();
    const userB = await createUser();
    const conversation = await Conversation.create({
      participants: [userA._id, userB._id],
      status: 'active',
    });

    const clientA = await connectUser(userA);
    const clientB = await connectUser(userB);

    await new Promise((resolve) => {
      clientA.emit('chat:join_room', { conversationId: conversation._id.toString() });
      clientB.emit('chat:join_room', { conversationId: conversation._id.toString() });
      setTimeout(resolve, 300);
    });

    const typingPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('chat:typing timeout')), 5000);
      clientB.on('chat:typing', (payload) => {
        if (payload.userId === userA._id.toString() && payload.isTyping === true) {
          clearTimeout(timeout);
          resolve(payload);
        }
      });
    });

    clientA.emit('chat:typing_start', { conversationId: conversation._id.toString() });
    const typing = await typingPromise;

    expect(typing.conversationId).toBe(conversation._id.toString());
    expect(typing.isTyping).toBe(true);

    clientA.close();
    clientB.close();
  });
});
