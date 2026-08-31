const socketService = require('../../../src/services/socketService');

describe('socketService', () => {
  beforeEach(() => {
    socketService.setIo(null);
  });

  it('returns null when io has not been set', () => {
    expect(socketService.getIo()).toBeNull();
  });

  it('stores and returns the same io instance via setIo/getIo', () => {
    const mockIo = { emit: jest.fn(), to: jest.fn() };

    socketService.setIo(mockIo);

    expect(socketService.getIo()).toBe(mockIo);
  });

  it('overwrites the previous io instance when setIo is called again', () => {
    const firstIo = { id: 'first' };
    const secondIo = { id: 'second' };

    socketService.setIo(firstIo);
    socketService.setIo(secondIo);

    expect(socketService.getIo()).toBe(secondIo);
    expect(socketService.getIo()).not.toBe(firstIo);
  });
});
