const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

const emailService = require('../../../src/services/emailService');

describe('emailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EMAIL_USER = 'noreply@test.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });
  });

  it('sendOTPEmail sends registration OTP with correct recipient and subject', async () => {
    await emailService.sendOTPEmail('user@test.com', 'Jane Doe', '123456', 'register');

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringContaining('noreply@test.com'),
        to: 'user@test.com',
        subject: 'Verify Your Banana Account',
        html: expect.stringContaining('123456'),
      })
    );
  });

  it('sendPasswordResetEmail includes reset link with token', async () => {
    await emailService.sendPasswordResetEmail('user@test.com', 'Jane Doe', 'reset-token-xyz');

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@test.com',
        subject: 'Reset Your Banana Password',
        html: expect.stringContaining('reset-token-xyz'),
      })
    );
  });

  it('sendBidReceivedEmail sends tender owner notification', async () => {
    const result = await emailService.sendBidReceivedEmail(
      'owner@test.com',
      'Owner Name',
      'Bidder Co',
      'Road Project',
      'tender-id-1',
      50000,
      'ETB'
    );

    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'owner@test.com',
        subject: expect.stringContaining('Road Project'),
        html: expect.stringContaining('Bidder Co'),
      })
    );
  });

  it('sendOTPEmail throws when transporter fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP unavailable'));

    await expect(
      emailService.sendOTPEmail('user@test.com', 'Jane', '999999')
    ).rejects.toThrow('Failed to send verification email');
  });
});
