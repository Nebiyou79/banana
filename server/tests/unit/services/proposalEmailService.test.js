jest.mock('../../../src/services/emailService', () => ({
  sendEmail: jest.fn(),
}));

const { sendEmail } = require('../../../src/services/emailService');
const proposalEmailService = require('../../../src/services/proposalEmailService');

describe('proposalEmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.APP_NAME = 'FreelanceHub';
    sendEmail.mockResolvedValue({ messageId: 'msg-1' });
  });

  it('notifyOwnerNewProposal sends email to tender owner', async () => {
    await proposalEmailService.notifyOwnerNewProposal({
      ownerEmail: 'owner@test.com',
      ownerName: 'Alice Owner',
      freelancerName: 'Bob Freelancer',
      tenderTitle: 'Website Redesign',
      proposalId: 'proposal-123',
    });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      'owner@test.com',
      'New proposal received for: Website Redesign',
      expect.stringContaining('Bob Freelancer')
    );
    expect(sendEmail.mock.calls[0][2]).toContain('Website Redesign');
  });

  it('notifyFreelancerSubmitted confirms submission to freelancer', async () => {
    await proposalEmailService.notifyFreelancerSubmitted({
      freelancerEmail: 'freelancer@test.com',
      freelancerName: 'Bob Freelancer',
      tenderTitle: 'Mobile App',
      proposalId: 'proposal-456',
    });

    expect(sendEmail).toHaveBeenCalledWith(
      'freelancer@test.com',
      'Your proposal was submitted successfully',
      expect.stringContaining('Mobile App')
    );
  });

  it('notifyFreelancerAwarded sends congratulations email', async () => {
    await proposalEmailService.notifyFreelancerAwarded({
      freelancerEmail: 'freelancer@test.com',
      freelancerName: 'Bob',
      tenderTitle: 'API Integration',
      proposalId: 'proposal-789',
      ownerName: 'Client Corp',
    });

    expect(sendEmail).toHaveBeenCalledWith(
      'freelancer@test.com',
      "Congratulations — your proposal has been accepted!",
      expect.stringContaining('Client Corp')
    );
  });

  it('swallows email errors without throwing', async () => {
    sendEmail.mockRejectedValue(new Error('SMTP down'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      proposalEmailService.notifyFreelancerUnderReview({
        freelancerEmail: 'freelancer@test.com',
        freelancerName: 'Bob',
        tenderTitle: 'Logo Design',
      })
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
