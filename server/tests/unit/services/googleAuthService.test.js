const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

const { verifyGoogleToken, getGoogleUserInfo } = require('../../../src/services/googleAuthService');

describe('googleAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    global.fetch = jest.fn();
  });

  it('verifyGoogleToken returns standardized user data for a valid token', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-123',
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
        email_verified: true,
        given_name: 'Test',
        family_name: 'User',
        locale: 'en',
      }),
    });

    const result = await verifyGoogleToken('valid-id-token');

    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: 'valid-id-token',
      audience: ['test-google-client-id'],
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      googleId: 'google-123',
      email: 'user@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
      emailVerified: true,
      givenName: 'Test',
      familyName: 'User',
      locale: 'en',
    });
  });

  it('verifyGoogleToken returns failure when OAuth client rejects the token', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Token expired'));

    const result = await verifyGoogleToken('expired-token');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid Google token');
    expect(result.error).toBe('Token expired');
  });

  it('getGoogleUserInfo returns profile data from Google userinfo API', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: 'google-456',
        email: 'mobile@example.com',
        name: 'Mobile User',
        picture: 'https://example.com/mobile.jpg',
        email_verified: true,
        given_name: 'Mobile',
        family_name: 'User',
        locale: 'en-US',
      }),
    });

    const result = await getGoogleUserInfo('access-token-abc');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: 'Bearer access-token-abc' } }
    );
    expect(result.success).toBe(true);
    expect(result.data.googleId).toBe('google-456');
    expect(result.data.email).toBe('mobile@example.com');
  });

  it('getGoogleUserInfo returns failure when the userinfo request fails', async () => {
    global.fetch.mockResolvedValue({ ok: false });

    const result = await getGoogleUserInfo('bad-token');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to get Google user info');
  });
});
