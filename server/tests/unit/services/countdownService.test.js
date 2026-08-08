const mongoose = require('mongoose');
const countdownService = require('../../../src/services/countdownService');
const Tender = require('../../../src/models/Tender');
const { createPublishedTender } = require('../../helpers/factories/tenderFactory');

describe('countdownService', () => {
  afterEach(() => {
    countdownService.isRunning = false;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('checkTenderDeadlines completes without error when database is empty', async () => {
    await expect(countdownService.checkTenderDeadlines()).resolves.toBeUndefined();
    expect(countdownService.isRunning).toBe(false);
  });

  it('checkTenderDeadlines skips when already running', async () => {
    countdownService.isRunning = true;
    const findSpy = jest.spyOn(Tender, 'find');

    await countdownService.checkTenderDeadlines();

    expect(findSpy).not.toHaveBeenCalled();
    findSpy.mockRestore();
  });

  it('start invokes deadline and manual transition checks immediately', () => {
    jest.useFakeTimers();
    const deadlineSpy = jest
      .spyOn(countdownService, 'checkTenderDeadlines')
      .mockResolvedValue(undefined);
    const manualSpy = jest
      .spyOn(countdownService, 'checkManualTransitions')
      .mockResolvedValue(undefined);

    countdownService.start(1);

    expect(deadlineSpy).toHaveBeenCalledTimes(1);
    expect(manualSpy).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(60 * 1000);
    expect(deadlineSpy).toHaveBeenCalledTimes(2);
  });

  it('revealBidsForTender returns zero when no sealed bids exist', async () => {
    const tenderId = new mongoose.Types.ObjectId();

    const modifiedCount = await countdownService.revealBidsForTender(tenderId, tenderId);

    expect(modifiedCount).toBe(0);
  });

  it('auto-closes open tenders past deadline', async () => {
    const tender = await createPublishedTender({ workflowType: 'open' });
    await Tender.collection.updateOne(
      { _id: tender._id },
      { $set: { deadline: new Date(Date.now() - 60 * 1000), status: 'published' } }
    );

    await countdownService.checkTenderDeadlines();

    const updated = await Tender.findById(tender._id);
    expect(updated.status).toBe('closed');
    expect(updated.closedAt).toBeTruthy();
  });

  it('marks closed workflow tenders as deadline_reached', async () => {
    const tender = await createPublishedTender({ workflowType: 'closed' });
    await Tender.collection.updateOne(
      { _id: tender._id },
      { $set: { deadline: new Date(Date.now() - 60 * 1000), status: 'published' } }
    );

    await countdownService.checkTenderDeadlines();

    const updated = await Tender.findById(tender._id);
    expect(updated.status).toBe('deadline_reached');
    expect(updated.deadlineReachedAt).toBeTruthy();
  });

  it('updateDaysRemaining sets metadata on active tenders', async () => {
    const tender = await createPublishedTender({
      workflowType: 'open',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await countdownService.updateDaysRemaining();

    const updated = await Tender.findById(tender._id);
    expect(updated.metadata.daysRemaining).toBeGreaterThanOrEqual(6);
  });

  it('checkManualTransitions completes without error', async () => {
    await expect(countdownService.checkManualTransitions()).resolves.toBeUndefined();
  });
});
