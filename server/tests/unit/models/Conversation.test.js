const Conversation = require('../../../src/models/Conversation');
const { createUser } = require('../../helpers/auth');

describe('Conversation model', () => {
  it('saves direct conversation with participants', async () => {
    const userA = await createUser();
    const userB = await createUser();

    const conversation = await Conversation.create({
      participants: [userA._id, userB._id],
    });

    expect(conversation.type).toBe('direct');
    expect(conversation.status).toBe('active');
  });

  it('findOrCreate returns existing conversation on second call', async () => {
    const userA = await createUser();
    const userB = await createUser();

    const first = await Conversation.findOrCreate(userA._id, userB._id);
    const second = await Conversation.findOrCreate(userA._id, userB._id);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.conversation._id.toString()).toBe(first.conversation._id.toString());
  });

  it('incrementUnread and markReadFor manage unread counts', async () => {
    const userA = await createUser();
    const userB = await createUser();

    const { conversation } = await Conversation.findOrCreate(userA._id, userB._id);
    await conversation.incrementUnread(userB._id, 2);

    expect(conversation.unreadCounts.get(userB._id.toString())).toBe(2);

    await conversation.markReadFor(userB._id);

    expect(conversation.unreadCounts.get(userB._id.toString())).toBe(0);
  });

  it('otherParticipantId returns the other user in a DM', async () => {
    const userA = await createUser();
    const userB = await createUser();

    const { conversation } = await Conversation.findOrCreate(userA._id, userB._id);

    expect(conversation.otherParticipantId(userA._id).toString()).toBe(userB._id.toString());
  });
});
