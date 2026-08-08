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

  it('sendNotificationEmail sends formatted notification email', async () => {
    await emailService.sendNotificationEmail({
      to: 'user@test.com',
      recipientName: 'Jane Doe',
      notification: {
        type: 'post_liked',
        title: 'Post liked',
        body: 'Someone liked your post',
        data: { screen: 'PostDetail', entityId: 'post-1' },
      },
    });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@test.com',
        subject: '[BananaLink] Post liked',
        html: expect.stringContaining('Someone liked your post'),
      })
    );
  });

  it('sendDigestEmail sends summary for multiple notifications', async () => {
    await emailService.sendDigestEmail({
      to: 'user@test.com',
      recipientName: 'Jane Doe',
      period: 'yesterday',
      notifications: [
        { title: 'New follower', body: 'Alice followed you', data: { screen: 'Profile' } },
        { title: 'Post liked', body: 'Bob liked your post', data: {} },
      ],
    });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@test.com',
        subject: expect.stringContaining('BananaLink Digest'),
        html: expect.stringContaining('New follower'),
      })
    );
  });

  it('sendDigestEmail returns early when notifications array is empty', async () => {
    await emailService.sendDigestEmail({
      to: 'user@test.com',
      recipientName: 'Jane Doe',
      notifications: [],
    });

    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('sendOTPEmail throws when transporter fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP unavailable'));

    await expect(
      emailService.sendOTPEmail('user@test.com', 'Jane', '999999')
    ).rejects.toThrow('Failed to send verification email');
  });

  it('sendBidUnderReviewEmail notifies bidder', async () => {
    const result = await emailService.sendBidUnderReviewEmail(
      'bidder@test.com',
      'Bidder Name',
      'Highway Project',
      'tender-1'
    );
    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('sendBidShortlistedEmail notifies bidder', async () => {
    await emailService.sendBidShortlistedEmail(
      'bidder@test.com',
      'Bidder Name',
      'Bridge Project',
      'tender-2'
    );
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('sendBidAwardedEmail notifies winning bidder', async () => {
    await emailService.sendBidAwardedEmail(
      'winner@test.com',
      'Winner Co',
      'Airport Project',
      'tender-3',
      500000,
      'ETB'
    );
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('sendBidRejectedEmail notifies rejected bidder', async () => {
    await emailService.sendBidRejectedEmail(
      'loser@test.com',
      'Loser Co',
      'Hospital Project',
      'tender-4'
    );
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('sendBidWithdrawnEmail notifies tender owner', async () => {
    await emailService.sendBidWithdrawnEmail(
      'owner@test.com',
      'Owner Name',
      'Bidder Co',
      'School Project',
      'tender-5'
    );
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('sendBidsRevealedEmail notifies owner', async () => {
    await emailService.sendBidsRevealedEmail(
      'owner@test.com',
      'Owner Name',
      'Sealed Project',
      'tender-6',
      5
    );
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('sendTenderInvitationEmail sends invitation', async () => {
    await emailService.sendTenderInvitationEmail(
      'invitee@test.com',
      'Invitee Name',
      { title: 'Invite Tender', _id: 'tender-7' },
      { name: 'Owner', email: 'owner@test.com' }
    );
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('sendTenderEmailInvitation sends email invitation', async () => {
    await emailService.sendTenderEmailInvitation(
      'external@test.com',
      { title: 'Email Invite Tender', _id: 'tender-8' },
      { name: 'Owner' },
      'invite-token-abc'
    );
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('sendInvitationAcceptedEmail notifies owner', async () => {
    await emailService.sendInvitationAcceptedEmail(
      'owner@test.com',
      'Owner Name',
      'Accepted User',
      { title: 'Accepted Tender' }
    );
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('sendOTPEmail sends reset password OTP variant', async () => {
    await emailService.sendOTPEmail('user@test.com', 'Jane', '654321', 'reset');
    expect(mockSendMail).toHaveBeenCalled();
  });

  const appointmentData = {
    fullName: 'Jane Doe',
    verificationType: 'identity',
    appointmentDate: '2026-08-10',
    appointmentTime: '10:00 AM',
    officeLocation: 'Addis Ababa Office',
    documentsRequired: ['Passport', 'National ID'],
  };

  it('sendEmail sends appointment confirmation template', async () => {
    await emailService.sendEmail({
      to: 'patient@test.com',
      subject: 'Appointment Confirmed',
      template: 'appointmentConfirmation',
      data: appointmentData,
    });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'patient@test.com',
        subject: 'Appointment Confirmed',
      })
    );
  });

  it('sendEmail throws for unknown template', async () => {
    await expect(
      emailService.sendEmail({
        to: 'user@test.com',
        subject: 'Test',
        template: 'nonexistent_template',
        data: {},
      })
    ).rejects.toThrow('Email template "nonexistent_template" not found');
  });

  it('sendTenderShareLinkEmail throws when template helper is missing (current behavior)', async () => {
    await expect(
      emailService.sendTenderShareLinkEmail(
        'share@test.com',
        { title: 'Shared Tender', _id: 'tender-share', tenderId: 'TND-001' },
        { name: 'Owner' },
        'https://example.com/share/abc'
      )
    ).rejects.toThrow('Failed to send tender share link email');
  });

  it('sendAppointmentConfirmationEmail sends confirmation', async () => {
    await emailService.sendAppointmentConfirmationEmail({
      to: 'patient@test.com',
      subject: 'Appointment Confirmed',
      data: appointmentData,
    });
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('sendAppointmentStatusUpdateEmail sends status update', async () => {
    await emailService.sendAppointmentStatusUpdateEmail({
      to: 'patient@test.com',
      subject: 'Appointment Updated',
      data: {
        fullName: 'Jane Doe',
        verificationType: 'identity',
        appointmentDate: '2026-08-10',
        appointmentTime: '10:00 AM',
        status: 'confirmed',
        officeLocation: 'Addis Ababa Office',
      },
    });
    expect(mockSendMail).toHaveBeenCalled();
  });
});
