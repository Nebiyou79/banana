const countdownService = require('../../../src/services/countdownService');

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
    const Tender = require('../../../src/models/Tender');
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
    const mongoose = require('mongoose');
    const tenderId = new mongoose.Types.ObjectId();

    const modifiedCount = await countdownService.revealBidsForTender(tenderId, tenderId);

    expect(modifiedCount).toBe(0);
  });
});
