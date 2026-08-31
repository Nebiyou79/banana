const Message = require('../../../src/models/Message');
const Conversation = require('../../../src/models/Conversation');
const { createUser } = require('../../helpers/auth');

describe('Message model', () => {
  async function seedMessage() {
    const sender = await createUser();
    const recipient = await createUser();
    const { conversation } = await Conversation.findOrCreate(sender._id, recipient._id);

    const message = await Message.create({
      conversationId: conversation._id,
      sender: sender._id,
      content: 'Hello there',
    });

    return { message, sender, recipient };
  }

  it('rejects empty content for text messages', async () => {
    const sender = await createUser();
    const recipient = await createUser();
    const { conversation } = await Conversation.findOrCreate(sender._id, recipient._id);

    await expect(
      Message.create({
        conversationId: conversation._id,
        sender: sender._id,
        content: '',
      })
    ).rejects.toThrow();
  });

  it('sets canDeleteUntil on new messages', async () => {
    const { message } = await seedMessage();

    expect(message.canDeleteUntil).toBeInstanceOf(Date);
    expect(message.canDeleteUntil.getTime()).toBeGreaterThan(Date.now());
  });

  it('canBeDeletedBy allows sender within delete window', async () => {
    const { message, sender, recipient } = await seedMessage();

    expect(message.canBeDeletedBy(sender._id)).toBe(true);
    expect(message.canBeDeletedBy(recipient._id)).toBe(false);
  });

  it('markDeletedForEveryone clears content and marks type deleted', async () => {
    const { message, sender } = await seedMessage();

    await message.markDeletedForEveryone(sender._id);

    expect(message.type).toBe('deleted');
    expect(message.content).toBeNull();
    expect(message.deletedBy.toString()).toBe(sender._id.toString());
  });
});
