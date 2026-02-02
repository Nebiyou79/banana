// update-all-jobs-config.js
require('dotenv').config();
const mongoose = require('mongoose');

async function updateAllJobsConfig() {
  try {
    console.log('🚀 Starting job configuration update...');
    console.log('📡 Connecting to MongoDB Atlas...');

    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB Atlas');

    // Define a simplified Job schema for migration
    const jobSchema = new mongoose.Schema({}, { strict: false });
    const Job = mongoose.model('Job', jobSchema, 'jobs');

    // Get all jobs
    const jobs = await Job.find({}).lean();
    console.log(`📊 Found ${jobs.length} total jobs`);

    let updatedCount = 0;
    let batchSize = 50;

    // Process in batches
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      console.log(`\n📄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jobs.length / batchSize)}`);

      for (const job of batch) {
        try {
          // Apply the new configuration
          const updates = {
            isApplyEnabled: false,          // Disable applications
            salaryMode: 'company-scale',     // Set to company scale
            candidatesNeeded: 6              // Set to 6 candidates
          };

          // For company-scale mode, we should clear salary range fields
          // to avoid validation errors
          updates.salary = {
            isPublic: false,
            isNegotiable: false,
            // Clear min/max for company-scale mode
            min: undefined,
            max: undefined
          };

          // Update the job
          await Job.updateOne(
            { _id: job._id },
            { $set: updates },
            { runValidators: false }
          );

          updatedCount++;
          console.log(`   ✅ Updated job ${job._id}: "${job.title?.substring(0, 30)}..."`);
          console.log(`     - isApplyEnabled: false`);
          console.log(`     - salaryMode: company-scale`);
          console.log(`     - candidatesNeeded: 6`);

        } catch (error) {
          console.log(`   ❌ Failed to update job ${job._id}: ${error.message}`);
        }
      }
    }

    console.log('\n📋 UPDATE SUMMARY:');
    console.log(`   Total jobs: ${jobs.length}`);
    console.log(`   Successfully updated: ${updatedCount}`);
    console.log(`   Failed: ${jobs.length - updatedCount}`);

    console.log('\n✅ Configuration update completed!');
    console.log('\n📝 All jobs now have:');
    console.log('   • Applications disabled (isApplyEnabled = false)');
    console.log('   • Salary set to "company scale" (salaryMode = "company-scale")');
    console.log('   • 6 candidates needed (candidatesNeeded = 6)');

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');

    // Also update the Job model to reflect these defaults
    console.log('\n💡 To make these the default for new jobs, update your Job model with:');
    console.log(`
    salaryMode: {
      type: String,
      enum: ['range', 'hidden', 'negotiable', 'company-scale'],
      default: 'company-scale'  // Change default to company-scale
    },
    
    candidatesNeeded: {
      type: Number,
      required: [true, 'Number of candidates needed is required'],
      min: [1, 'At least 1 candidate is required'],
      default: 6  // Change default to 6
    },
    
    isApplyEnabled: {
      type: Boolean,
      default: false  // Change default to false
    }
    `);

    process.exit(0);

  } catch (error) {
    console.error('❌ Update failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run update
updateAllJobsConfig();