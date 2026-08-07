const mockMessagingSend = jest.fn();
const mockInitializeApp = jest.fn(() => ({ name: 'test-app' }));
const mockCert = jest.fn();

jest.mock('firebase-admin', () => ({
  initializeApp: (...args) => mockInitializeApp(...args),
  credential: { cert: (...args) => mockCert(...args) },
  messaging: () => ({ send: mockMessagingSend }),
}));

describe('firebaseService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  });

  it('returns not configured when Firebase credentials are missing', async () => {
    const firebaseService = require('../../../src/services/firebaseService');

    const result = await firebaseService.send('fcm-token', {
      title: 'Hello',
      body: 'World',
    });

    expect(result).toEqual({ success: false, error: 'Firebase not configured' });
    expect(mockMessagingSend).not.toHaveBeenCalled();
  });

  it('sends a push notification when Firebase is configured', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      project_id: 'test-project',
      client_email: 'firebase@test.iam.gserviceaccount.com',
      private_key: 'test-key',
    });
    mockMessagingSend.mockResolvedValue('message-id-123');

    const firebaseService = require('../../../src/services/firebaseService');
    const result = await firebaseService.send('device-token', {
      title: 'New bid',
      body: 'You received a bid',
      data: { tenderId: 'abc', amount: 1000 },
      priority: 'critical',
    });

    expect(mockInitializeApp).toHaveBeenCalled();
    expect(mockMessagingSend).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'device-token',
        notification: { title: 'New bid', body: 'You received a bid' },
        data: { tenderId: 'abc', amount: '1000' },
        android: expect.objectContaining({ priority: 'high' }),
      })
    );
    expect(result).toEqual({ success: true, messageId: 'message-id-123' });
  });

  it('returns failure when Firebase messaging throws', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      project_id: 'test-project',
      client_email: 'firebase@test.iam.gserviceaccount.com',
      private_key: 'test-key',
    });
    mockMessagingSend.mockRejectedValue(new Error('Invalid registration token'));

    const firebaseService = require('../../../src/services/firebaseService');
    const result = await firebaseService.send('bad-token', {
      title: 'Test',
      body: 'Test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid registration token');
  });
});
