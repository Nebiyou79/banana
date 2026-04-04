// services/proposalEmailService.js
// Proposal email templates. Uses existing emailService.js: sendEmail(to, subject, htmlBody).
// Email failures are always caught and logged — they NEVER throw or fail the parent request.
const { sendEmail } = require('./emailService');

// ─── Shared HTML helpers ────────────────────────────────────────────────────

const APP_NAME = process.env.APP_NAME || 'FreelanceHub';
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BRAND_COLOR = '#1A56DB';

const htmlWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;max-width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};padding:24px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">${APP_NAME}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;">
              <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br/>
                You are receiving this email because you have an account on ${APP_NAME}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const ctaButton = (href, label) =>
    `<a href="${href}"
       style="display:inline-block;margin-top:24px;padding:12px 28px;
              background:${BRAND_COLOR};color:#ffffff;text-decoration:none;
              font-size:15px;font-weight:600;border-radius:6px;"
     >${label}</a>`;

const greeting = (name) =>
    `<p style="margin:0 0 16px;font-size:16px;color:#111827;">Hi <strong>${name}</strong>,</p>`;

const paragraph = (text) =>
    `<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">${text}</p>`;

// ─── 1. Notify tender owner of new proposal ─────────────────────────────────

/**
 * notifyOwnerNewProposal
 * @param {Object} params
 * @param {string} params.ownerEmail
 * @param {string} params.ownerName
 * @param {string} params.freelancerName
 * @param {string} params.tenderTitle
 * @param {string} params.proposalId
 */
const notifyOwnerNewProposal = async ({ ownerEmail, ownerName, freelancerName, tenderTitle, proposalId }) => {
    try {
        const proposalUrl = `${BASE_URL}/owner/proposals/${proposalId}`;

        const html = htmlWrapper(`
            ${greeting(ownerName)}
            ${paragraph(`<strong>${freelancerName}</strong> has submitted a proposal for your tender:`)}
            <p style="margin:0 0 20px;padding:16px;background:#eff6ff;border-left:4px solid ${BRAND_COLOR};
                       font-size:15px;color:#1e40af;font-weight:600;border-radius:0 4px 4px 0;">
              ${tenderTitle}
            </p>
            ${paragraph('Review the proposal to shortlist, schedule an interview, or reach out to the applicant.')}
            ${ctaButton(proposalUrl, 'Review Proposal')}
            ${paragraph(`<span style="color:#6b7280;font-size:13px;">If the button above doesn't work, copy this link into your browser:<br/>${proposalUrl}</span>`)}
        `);

        await sendEmail(ownerEmail, `New proposal received for: ${tenderTitle}`, html);
    } catch (error) {
        console.error('[proposalEmailService.notifyOwnerNewProposal]', error.message);
    }
};

// ─── 2. Confirm submission to freelancer ────────────────────────────────────

/**
 * notifyFreelancerSubmitted
 * @param {Object} params
 * @param {string} params.freelancerEmail
 * @param {string} params.freelancerName
 * @param {string} params.tenderTitle
 * @param {string} params.proposalId
 */
const notifyFreelancerSubmitted = async ({ freelancerEmail, freelancerName, tenderTitle, proposalId }) => {
    try {
        const proposalUrl = `${BASE_URL}/freelancer/proposals/${proposalId}`;

        const html = htmlWrapper(`
            ${greeting(freelancerName)}
            ${paragraph('Your proposal has been submitted successfully! Here\'s a summary:')}
            <p style="margin:0 0 20px;padding:16px;background:#f0fdf4;border-left:4px solid #16a34a;
                       font-size:15px;color:#15803d;font-weight:600;border-radius:0 4px 4px 0;">
              ${tenderTitle}
            </p>
            ${paragraph('The tender owner will review your application. You\'ll receive an email when there\'s an update on your proposal status.')}
            ${paragraph('In the meantime, you can track the status of your proposal at any time.')}
            ${ctaButton(proposalUrl, 'View My Proposal')}
        `);

        await sendEmail(freelancerEmail, 'Your proposal was submitted successfully', html);
    } catch (error) {
        console.error('[proposalEmailService.notifyFreelancerSubmitted]', error.message);
    }
};

// ─── 3. Proposal is now under review ────────────────────────────────────────

/**
 * notifyFreelancerUnderReview
 * @param {Object} params
 * @param {string} params.freelancerEmail
 * @param {string} params.freelancerName
 * @param {string} params.tenderTitle
 */
const notifyFreelancerUnderReview = async ({ freelancerEmail, freelancerName, tenderTitle }) => {
    try {
        const html = htmlWrapper(`
            ${greeting(freelancerName)}
            ${paragraph(`Good news — the tender owner has started reviewing your proposal for <strong>${tenderTitle}</strong>.`)}
            ${paragraph('This means your application is actively being considered. We\'ll notify you as soon as there\'s a further update.')}
            ${paragraph('Keep an eye on your inbox!')}
        `);

        await sendEmail(freelancerEmail, 'Your proposal is under review', html);
    } catch (error) {
        console.error('[proposalEmailService.notifyFreelancerUnderReview]', error.message);
    }
};

// ─── 4. Freelancer has been shortlisted ─────────────────────────────────────

/**
 * notifyFreelancerShortlisted
 * @param {Object} params
 * @param {string} params.freelancerEmail
 * @param {string} params.freelancerName
 * @param {string} params.tenderTitle
 * @param {string} params.proposalId
 */
const notifyFreelancerShortlisted = async ({ freelancerEmail, freelancerName, tenderTitle, proposalId }) => {
    try {
        const proposalUrl = `${BASE_URL}/freelancer/proposals/${proposalId}`;

        const html = htmlWrapper(`
            ${greeting(freelancerName)}
            <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;">⭐ You've been shortlisted!</p>
            ${paragraph(`Congratulations! The tender owner has shortlisted your proposal for <strong>${tenderTitle}</strong>. This is a great sign — you're among the top candidates being considered for this project.`)}
            ${paragraph('Next steps may include an interview or further discussion with the client. Stay responsive and be ready to answer any follow-up questions.')}
            ${ctaButton(proposalUrl, 'View Your Proposal')}
        `);

        await sendEmail(freelancerEmail, "Great news — you've been shortlisted!", html);
    } catch (error) {
        console.error('[proposalEmailService.notifyFreelancerShortlisted]', error.message);
    }
};

// ─── 5. Proposal rejected ───────────────────────────────────────────────────

/**
 * notifyFreelancerRejected
 * @param {Object} params
 * @param {string} params.freelancerEmail
 * @param {string} params.freelancerName
 * @param {string} params.tenderTitle
 * @param {string} [params.ownerNotes]
 */
const notifyFreelancerRejected = async ({ freelancerEmail, freelancerName, tenderTitle, ownerNotes }) => {
    try {
        const feedbackBlock = ownerNotes
            ? `<div style="margin:16px 0;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">
                 <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Feedback from client</p>
                 <p style="margin:0;font-size:15px;color:#374151;">${ownerNotes}</p>
               </div>`
            : '';

        const html = htmlWrapper(`
            ${greeting(freelancerName)}
            ${paragraph(`Thank you for applying to <strong>${tenderTitle}</strong>. After careful consideration, the client has decided to move forward with another candidate at this time.`)}
            ${feedbackBlock}
            ${paragraph('We encourage you to keep applying to other opportunities. Every proposal is a chance to improve and connect with new clients.')}
            ${paragraph('Browse other open tenders and continue building your freelance career.')}
            ${ctaButton(`${BASE_URL}/freelancer/tenders`, 'Browse Open Tenders')}
        `);

        await sendEmail(freelancerEmail, `Update on your proposal for ${tenderTitle}`, html);
    } catch (error) {
        console.error('[proposalEmailService.notifyFreelancerRejected]', error.message);
    }
};

// ─── 6. Proposal awarded ────────────────────────────────────────────────────

/**
 * notifyFreelancerAwarded
 * @param {Object} params
 * @param {string} params.freelancerEmail
 * @param {string} params.freelancerName
 * @param {string} params.tenderTitle
 * @param {string} params.proposalId
 * @param {string} params.ownerName
 */
const notifyFreelancerAwarded = async ({ freelancerEmail, freelancerName, tenderTitle, proposalId, ownerName }) => {
    try {
        const proposalUrl = `${BASE_URL}/freelancer/proposals/${proposalId}`;

        const html = htmlWrapper(`
            ${greeting(freelancerName)}
            <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">🏆 Congratulations — you've been awarded the project!</p>
            ${paragraph(`<strong>${ownerName}</strong> has accepted your proposal for <strong>${tenderTitle}</strong>. This is a fantastic achievement!`)}
            ${paragraph('Please get in touch with the client as soon as possible to discuss next steps, align on the project scope, and get started.')}
            ${paragraph('We wish you a successful and productive collaboration!')}
            ${ctaButton(proposalUrl, 'View Your Proposal')}
        `);

        await sendEmail(freelancerEmail, "Congratulations — your proposal has been accepted!", html);
    } catch (error) {
        console.error('[proposalEmailService.notifyFreelancerAwarded]', error.message);
    }
};

module.exports = {
    notifyOwnerNewProposal,
    notifyFreelancerSubmitted,
    notifyFreelancerUnderReview,
    notifyFreelancerShortlisted,
    notifyFreelancerRejected,
    notifyFreelancerAwarded
};