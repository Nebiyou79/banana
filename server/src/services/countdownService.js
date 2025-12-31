const Tender = require('../models/Tender');

/**
 * Service to automatically transition tender states based on deadlines
 */
class CountdownService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Check and update tender statuses based on deadlines
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
      
      // Find tenders that need status transition
      const tendersToUpdate = await Tender.find({
        isDeleted: false,
        $or: [
          {
            status: 'published',
            deadline: { $lte: now }
          },
          {
            status: 'locked',
            deadline: { $lte: now }
          }
        ]
      });

      console.log(`📊 Found ${tendersToUpdate.length} tenders to update`);

      for (const tender of tendersToUpdate) {
        try {
          const previousStatus = tender.status;
          
          if (tender.workflowType === 'open') {
            // Open tenders become closed
            tender.status = 'closed';
            tender.closedAt = now;
          } else if (tender.workflowType === 'closed') {
            // Closed tenders become deadline_reached
            tender.status = 'deadline_reached';
            tender.deadlineReachedAt = now;
          }

          await tender.save();
          
          console.log(`✅ Tender ${tender._id} transitioned from ${previousStatus} to ${tender.status}`);
          
          // Add audit log
          await tender.addAuditLog('AUTO_TRANSITION', null, {
            action: 'Auto status transition',
            previousStatus,
            newStatus: tender.status,
            triggeredBy: 'countdown_service'
          });

        } catch (tenderError) {
          console.error(`❌ Error updating tender ${tender._id}:`, tenderError);
        }
      }

      // Also update days remaining for active tenders
      await this.updateDaysRemaining();

    } catch (error) {
      console.error('❌ Error in countdown service:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Update days remaining for all active tenders
   */
  async updateDaysRemaining() {
    try {
      const now = new Date();
      
      const activeTenders = await Tender.find({
        isDeleted: false,
        status: { $in: ['published', 'locked'] },
        deadline: { $gt: now }
      });

      for (const tender of activeTenders) {
        const diffTime = tender.deadline - now;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        tender.metadata.daysRemaining = daysRemaining > 0 ? daysRemaining : 0;
        await tender.save();
      }

      console.log(`📅 Updated days remaining for ${activeTenders.length} active tenders`);
    } catch (error) {
      console.error('❌ Error updating days remaining:', error);
    }
  }

  /**
   * Check for tender status transitions that need manual intervention
   */
  async checkManualTransitions() {
    try {
      const now = new Date();
      
      // Find closed tenders that have reached deadline but not revealed
      const tendersNeedingReveal = await Tender.find({
        isDeleted: false,
        workflowType: 'closed',
        status: 'deadline_reached',
        deadline: { $lte: now },
        revealedAt: null
      });

      console.log(`🔍 Found ${tendersNeedingReveal.length} closed tenders needing manual reveal`);

      // Send notifications to tender owners
      for (const tender of tendersNeedingReveal) {
        try {
          // Here you would typically send a notification to the tender owner
          // to manually reveal the proposals
          console.log(`📧 Tender ${tender._id} needs manual proposal reveal`);
        } catch (error) {
          console.error(`Error processing tender ${tender._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking manual transitions:', error);
    }
  }

  /**
   * Start the countdown service
   */
  start(intervalMinutes = 1) {
    console.log(`🚀 Starting CountdownService (checking every ${intervalMinutes} minute(s))`);
    
    // Run immediately on start
    this.checkTenderDeadlines();
    this.checkManualTransitions();
    
    // Then run on interval
    setInterval(() => {
      this.checkTenderDeadlines();
    }, intervalMinutes * 60 * 1000);

    // Check manual transitions every 5 minutes
    setInterval(() => {
      this.checkManualTransitions();
    }, 5 * 60 * 1000);
  }
}

// Create singleton instance
const countdownService = new CountdownService();

module.exports = countdownService;