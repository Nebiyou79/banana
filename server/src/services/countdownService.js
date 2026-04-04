// backend/src/services/countdownService.js
// ✅ FIXED: BUG-2.6 — revealBids now calls Bid.updateMany() to update the
//           standalone Bid collection after ProfessionalTender.revealAllBids().
//           Previously only the embedded tender.bids[] array was updated,
//           leaving all standalone Bid documents with sealed=true forever.

const Tender = require('../models/Tender');
const ProfessionalTender = require('../models/ProfessionalTender');
const FreelanceTender = require('../models/FreelanceTender');
// BUG-2.6 FIX: Import standalone Bid model
const Bid = require('../models/Bid');
const mongoose = require('mongoose');

/**
 * Service to automatically transition tender states based on deadlines.
 * Runs on a configurable interval (default: every 1 minute).
 */
class CountdownService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Check and update tender statuses based on deadlines.
   * Also handles auto-reveal for sealed professional tenders if configured.
   */
  async checkTenderDeadlines() {
    if (this.isRunning) {
      console.log('⏳ CountdownService is already running, skipping...');
      return;
    }

    this.isRunning = true;
    try {
      console.log('🔄 Running tender deadline check...');
      const now = new Date();

      // ══════════════════════════════════════════════════════════
      // EXISTING Tender model (legacy system — untouched)
      // ══════════════════════════════════════════════════════════
      const tendersToUpdate = await Tender.find({
        isDeleted: false,
        $or: [
          { status: 'published', deadline: { $lte: now } },
          { status: 'locked', deadline: { $lte: now } }
        ]
      });

      console.log(`📊 Found ${tendersToUpdate.length} tenders to update (old system)`);

      for (const tender of tendersToUpdate) {
        try {
          const previousStatus = tender.status;
          const originalDeadline = tender.deadline;

          if (tender.workflowType === 'open') {
            await Tender.updateOne(
              { _id: tender._id },
              {
                $set: {
                  status: 'closed',
                  closedAt: now,
                  'metadata.isUpdated': true,
                  'metadata.updateCount': (tender.metadata?.updateCount || 0) + 1,
                  'metadata.lastUpdatedAt': now
                }
              }
            );
          } else if (tender.workflowType === 'closed') {
            await Tender.updateOne(
              { _id: tender._id },
              {
                $set: {
                  status: 'deadline_reached',
                  deadlineReachedAt: now,
                  'metadata.isUpdated': true,
                  'metadata.updateCount': (tender.metadata?.updateCount || 0) + 1,
                  'metadata.lastUpdatedAt': now
                }
              }
            );
          }

          const newStatus = tender.workflowType === 'open' ? 'closed' : 'deadline_reached';
          console.log(`✅ Tender ${tender._id} transitioned ${previousStatus} → ${newStatus} (deadline: ${originalDeadline.toISOString()})`);

          await this.addAuditLog(tender._id, 'AUTO_TRANSITION', null, {
            action: 'Auto status transition',
            previousStatus,
            newStatus,
            triggeredBy: 'countdown_service',
            deadline: originalDeadline
          });

        } catch (tenderError) {
          console.error(`❌ Error updating tender ${tender._id}:`, tenderError);
        }
      }

      // ══════════════════════════════════════════════════════════
      // ProfessionalTender collection
      // ══════════════════════════════════════════════════════════
      const proToUpdate = await ProfessionalTender.find({
        isDeleted: false,
        $or: [
          { status: 'published', deadline: { $lte: now } },
          { status: 'locked', deadline: { $lte: now } }
        ]
      });

      console.log(`📊 Found ${proToUpdate.length} professional tenders to update`);

      for (const tender of proToUpdate) {
        try {
          const previousStatus = tender.status;
          const currentUpdateCount = tender.metadata?.updateCount || 0;

          if (tender.workflowType === 'open') {
            // Open tenders close immediately — no reveal step needed
            await ProfessionalTender.updateOne(
              { _id: tender._id },
              {
                $set: {
                  status: 'closed',
                  closedAt: now,
                  'metadata.updateCount': currentUpdateCount + 1,
                  'metadata.lastUpdatedAt': now
                }
              }
            );
            console.log(`✅ Professional tender ${tender._id} (open) auto-closed`);

          } else {
            // Closed/sealed tenders wait for manual reveal
            await ProfessionalTender.updateOne(
              { _id: tender._id },
              {
                $set: {
                  status: 'deadline_reached',
                  deadlineReachedAt: now,
                  'metadata.needsReveal': true,
                  'metadata.updateCount': currentUpdateCount + 1,
                  'metadata.lastUpdatedAt': now
                }
              }
            );
            console.log(`✅ Professional tender ${tender._id} (sealed) → deadline_reached, awaiting manual reveal`);
          }
        } catch (tenderError) {
          console.error(`❌ Error updating professional tender ${tender._id}:`, tenderError);
        }
      }

      // ══════════════════════════════════════════════════════════
      // FreelanceTender collection
      // ══════════════════════════════════════════════════════════
      const flTendersToUpdate = await FreelanceTender.find({
        isDeleted: false,
        status: 'published',
        deadline: { $lte: now }
      });

      let flUpdateCount = 0;
      for (const tender of flTendersToUpdate) {
        try {
          const currentUpdateCount = tender.metadata?.updateCount || 0;
          await FreelanceTender.updateOne(
            { _id: tender._id },
            {
              $set: {
                status: 'closed',
                closedAt: now,
                'metadata.updateCount': currentUpdateCount + 1,
                'metadata.lastUpdatedAt': now
              }
            }
          );
          flUpdateCount++;
        } catch (tenderError) {
          console.error(`❌ Error updating freelance tender ${tender._id}:`, tenderError);
        }
      }

      if (flUpdateCount > 0) {
        console.log(`✅ Freelance tenders auto-closed: ${flUpdateCount}`);
      }

      await this.updateDaysRemaining();

    } catch (error) {
      console.error('❌ Error in countdown service:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * BUG-2.6 FIX: Reveal bids for a specific professional tender.
   *
   * Previously revealBids in professionalTenderController only updated
   * the embedded tender.bids[] array (which is empty in the standalone
   * Bid system). This method now also updates all standalone Bid documents
   * so that sealed=false is reflected correctly across the entire system.
   *
   * Called from: professionalTenderController.revealBids() after tender.revealAllBids()
   *
   * @param {ObjectId|string} tenderId - The professional tender's _id
   * @param {ObjectId|string} userId   - The user triggering the reveal
   */
  async revealBidsForTender(tenderId, userId) {
    try {
      const now = new Date();

      // BUG-2.6 FIX: Update all standalone Bid documents for this tender
      const result = await Bid.updateMany(
        { tender: tenderId, sealed: true, isDeleted: false },
        { $set: { sealed: false, revealedAt: now } }
      );

      console.log(`🔓 Revealed ${result.modifiedCount} sealed bids for tender ${tenderId}`);

      // Also notify bidders via email if email service is available
      if (result.modifiedCount > 0) {
        try {
          const emailService = require('./emailService');
          const revealedBids = await Bid.find({
            tender: tenderId,
            isDeleted: false,
            status: { $ne: 'withdrawn' }
          }).populate('bidder', 'email firstName lastName');

          const tender = await ProfessionalTender.findById(tenderId).select('title');

          for (const bid of revealedBids) {
            if (bid.bidder && bid.bidder.email) {
              try {
                await emailService.sendBidsRevealedEmail(
                  bid.bidder.email,
                  `${bid.bidder.firstName || ''} ${bid.bidder.lastName || ''}`.trim() || 'Bidder',
                  tender ? tender.title : 'the tender',
                  tenderId,
                  bid.status,
                  bid.bidAmount,
                  bid.currency
                );
              } catch (emailErr) {
                console.error(`⚠️ Failed to send reveal email to ${bid.bidder.email}:`, emailErr.message);
              }
            }
          }
        } catch (emailErr) {
          console.error('⚠️ Failed to send reveal notification emails:', emailErr.message);
        }
      }

      return result.modifiedCount;
    } catch (error) {
      console.error(`❌ Error revealing bids for tender ${tenderId}:`, error);
      throw error;
    }
  }

  /**
   * Add audit log entry to a Tender document.
   */
  async addAuditLog(tenderId, action, performedBy, changes = {}) {
    try {
      await Tender.updateOne(
        { _id: tenderId },
        {
          $push: {
            auditLog: {
              action,
              performedBy,
              changes,
              performedAt: new Date(),
              ipAddress: 'system',
              userAgent: 'countdown_service'
            }
          }
        }
      );
    } catch (error) {
      console.error(`Error adding audit log for tender ${tenderId}:`, error);
    }
  }

  /**
   * Update daysRemaining metadata for all active tenders.
   */
  async updateDaysRemaining() {
    try {
      const now = new Date();

      // ── Legacy Tender model ────────────────────────────────
      const activeTenders = await Tender.find({
        isDeleted: false,
        status: { $in: ['published', 'locked'] },
        deadline: { $gt: now }
      });

      for (const tender of activeTenders) {
        const daysRemaining = Math.ceil((tender.deadline - now) / (1000 * 60 * 60 * 24));
        await Tender.updateOne(
          { _id: tender._id },
          { $set: { 'metadata.daysRemaining': Math.max(0, daysRemaining) } }
        );
      }
      if (activeTenders.length > 0) {
        console.log(`📅 Updated days remaining for ${activeTenders.length} active tenders (old system)`);
      }

      // ── ProfessionalTender ─────────────────────────────────
      const activePro = await ProfessionalTender.find({
        isDeleted: false,
        status: { $in: ['published', 'locked'] },
        deadline: { $gt: now }
      });

      for (const tender of activePro) {
        const daysRemaining = Math.ceil((tender.deadline - now) / (1000 * 60 * 60 * 24));
        await ProfessionalTender.updateOne(
          { _id: tender._id },
          { $set: { 'metadata.daysRemaining': Math.max(0, daysRemaining) } }
        );
      }
      if (activePro.length > 0) {
        console.log(`📅 Updated days remaining for ${activePro.length} active professional tenders`);
      }

      // ── FreelanceTender ────────────────────────────────────
      const activeFL = await FreelanceTender.find({
        isDeleted: false,
        status: 'published',
        deadline: { $gt: now }
      });

      for (const tender of activeFL) {
        const daysRemaining = Math.ceil((tender.deadline - now) / (1000 * 60 * 60 * 24));
        await FreelanceTender.updateOne(
          { _id: tender._id },
          { $set: { 'metadata.daysRemaining': Math.max(0, daysRemaining) } }
        );
      }
      if (activeFL.length > 0) {
        console.log(`📅 Updated days remaining for ${activeFL.length} active freelance tenders`);
      }

    } catch (error) {
      console.error('❌ Error updating days remaining:', error);
    }
  }

  /**
   * Check for tenders that need manual intervention (e.g. sealed bid reveal).
   */
  async checkManualTransitions() {
    try {
      const now = new Date();

      // ── Legacy Tender model ────────────────────────────────
      const tendersNeedingReveal = await Tender.find({
        isDeleted: false,
        workflowType: 'closed',
        status: 'deadline_reached',
        deadline: { $lte: now },
        revealedAt: null
      });

      if (tendersNeedingReveal.length > 0) {
        console.log(`🔍 Found ${tendersNeedingReveal.length} closed tenders needing manual reveal (old system)`);
      }

      for (const tender of tendersNeedingReveal) {
        try {
          console.log(`📧 Tender ${tender._id} (${tender.title}) needs manual proposal reveal`);
          await Tender.updateOne(
            { _id: tender._id },
            { $set: { 'metadata.needsReveal': true } }
          );
        } catch (error) {
          console.error(`Error processing tender ${tender._id}:`, error);
        }
      }

      // ── ProfessionalTender sealed tenders needing reveal ───
      const proNeedReveal = await ProfessionalTender.find({
        isDeleted: false,
        workflowType: 'closed',
        status: 'deadline_reached'
      });

      for (const tender of proNeedReveal) {
        try {
          await ProfessionalTender.updateOne(
            { _id: tender._id },
            { $set: { 'metadata.needsReveal': true } }
          );
          console.log(`🔍 Professional tender ${tender._id} (${tender.title}) awaiting manual bid reveal`);
        } catch (error) {
          console.error(`Error processing professional tender ${tender._id}:`, error);
        }
      }

      if (proNeedReveal.length > 0) {
        console.log(`🔍 Found ${proNeedReveal.length} professional tenders needing manual reveal`);
      }

    } catch (error) {
      console.error('❌ Error checking manual transitions:', error);
    }
  }

  /**
   * Start the countdown service on an interval.
   * @param {number} intervalMinutes - How often to run (default: 1 minute)
   */
  start(intervalMinutes = 1) {
    console.log(`🚀 Starting CountdownService (checking every ${intervalMinutes} minute(s))`);

    // Run immediately on start
    this.checkTenderDeadlines();
    this.checkManualTransitions();

    // Deadline check every intervalMinutes
    setInterval(() => {
      this.checkTenderDeadlines();
    }, intervalMinutes * 60 * 1000);

    // Manual transition check every 5 minutes
    setInterval(() => {
      this.checkManualTransitions();
    }, 5 * 60 * 1000);
  }
}

// Singleton instance
const countdownService = new CountdownService();

module.exports = countdownService;