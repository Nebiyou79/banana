/**
 * server/src/scripts/geocodeExistingJobs.js
 *
 * One-time migration script — backfills location.coordinates for every job
 * that already exists in the database, using a hardcoded lookup table of
 * Ethiopian cities and region centre-points.
 *
 * Run ONCE after deploying the updated Job.js model:
 *   node src/scripts/geocodeExistingJobs.js
 *
 * Safe to re-run: it only touches jobs that have no coordinates yet.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// ── Minimal job schema for the migration (no virtuals needed) ────────────────
const jobSchema = new mongoose.Schema({
  location: {
    region: String,
    city:   String,
    coordinates: {
      type: { type: String },
      coordinates: [Number]
    }
  }
}, { strict: false });
const Job = mongoose.model('Job', jobSchema);

// ── Ethiopian city → [longitude, latitude] (GeoJSON order) ──────────────────
// Add more cities here as needed.
const CITY_COORDS = {
  // Addis Ababa sub-cities / common names
  'addis ababa':         [38.7469, 9.0320],
  'addis-ababa':         [38.7469, 9.0320],
  'addisababa':          [38.7469, 9.0320],
  'kirkos':              [38.7469, 9.0197],
  'bole':                [38.7960, 9.0105],
  'yeka':                [38.8079, 9.0437],
  'lideta':              [38.7285, 9.0133],
  'kolfe keranio':       [38.6939, 9.0268],
  'gulele':              [38.7228, 9.0605],
  'arada':               [38.7456, 9.0340],
  'akaki kality':        [38.7965, 8.9349],
  'nifas silk-lafto':    [38.7610, 8.9981],
  'lemi kura':           [38.6678, 9.0707],

  // Major regional cities
  'adama':               [39.2686, 8.5400],
  'nazret':              [39.2686, 8.5400],
  'dire dawa':           [41.8661, 9.5930],
  'dire-dawa':           [41.8661, 9.5930],
  'mekelle':             [39.4760, 13.4990],
  'mekele':              [39.4760, 13.4990],
  'bahir dar':           [37.3836, 11.5742],
  'bahirdar':            [37.3836, 11.5742],
  'gondar':              [37.4686, 12.6030],
  'gonder':              [37.4686, 12.6030],
  'hawassa':             [38.4750, 7.0621],
  'awassa':              [38.4750, 7.0621],
  'jimma':               [36.8316, 7.6780],
  'jima':                [36.8316, 7.6780],
  'dessie':              [39.6370, 11.1333],
  'dese':                [39.6370, 11.1333],
  'nekemte':             [36.5459, 9.0864],
  'nekemet':             [36.5459, 9.0864],
  'jijiga':              [42.7960, 9.3500],
  'jigjiga':             [42.7960, 9.3500],
  'shashamane':          [38.5936, 7.2003],
  'shashemene':          [38.5936, 7.2003],
  'harar':               [42.1467, 9.3137],
  'harer':               [42.1467, 9.3137],
  'arba minch':          [37.5503, 6.0338],
  'arba-minch':          [37.5503, 6.0338],
  'arbaminch':           [37.5503, 6.0338],
  'woldia':              [39.6026, 11.8272],
  'woldiya':             [39.6026, 11.8272],
  'debre birhan':        [39.5310, 9.6800],
  'debre-birhan':        [39.5310, 9.6800],
  'debre markos':        [37.7290, 10.3380],
  'debre-markos':        [37.7290, 10.3380],
  'assosa':              [34.5334, 10.0679],
  'asosa':               [34.5334, 10.0679],
  'gambela':             [34.5871, 8.2540],
  'gambella':            [34.5871, 8.2540],
  'jinka':               [36.6560, 5.7960],
  'dilla':               [38.3108, 6.4110],
  'wolaita sodo':        [37.7548, 6.8490],
  'sodo':                [37.7548, 6.8490],
  'hosaena':             [37.8571, 7.5546],
  'hosaina':             [37.8571, 7.5546],
  'shire':               [38.2827, 14.1003],
  'axum':                [38.7183, 14.1290],
  'aksum':               [38.7183, 14.1290],
  'lalibela':            [39.0418, 12.0317],
  'debre tabor':         [38.0148, 11.8491],
  'injibara':            [36.9556, 10.9825],
  'burayu':              [38.6163, 9.0500],
  'sebeta':              [38.6266, 8.9157],
  'dukem':               [38.8530, 8.8260],
  'mojo':                [39.1197, 8.5932],
  'bishoftu':            [38.9913, 8.7540],
  'debre zeit':          [38.9913, 8.7540],
  'ambo':                [37.8583, 8.9839],
  'gedo':                [37.4302, 9.0148],
  'shambu':              [37.1016, 9.5716],
  'gimbi':               [35.8325, 9.1697],
  'dembi dolo':          [34.8000, 8.5330],
  'bedele':              [36.3545, 8.4510],
  'mizan teferi':        [35.5784, 6.9978],
  'tepi':                [35.4590, 7.2087],
  'bonga':               [36.2345, 7.2713],
  'mettu':               [35.5918, 8.2959],
  'gore':                [35.5367, 8.1601],
  'dembidolo':           [34.8000, 8.5330],
};

// ── Region centre-points (fallback when city is unknown) ────────────────────
const REGION_CENTERS = {
  'addis-ababa':          [38.7469, 9.0320],
  'afar':                 [41.0000, 11.7500],
  'amhara':               [37.8500, 11.3300],
  'benishangul-gumuz':    [35.5700, 10.7800],
  'dire-dawa':            [41.8661, 9.5930],
  'gambela':              [34.5871, 8.2540],
  'harari':               [42.1467, 9.3137],
  'oromia':               [39.6000, 8.0000],
  'sidama':               [38.4700, 6.7400],
  'snnpr':                [37.0700, 6.8400],
  'somali':               [44.0000, 7.2000],
  'south-west-ethiopia':  [35.8000, 7.0000],
  'tigray':               [39.4760, 13.4990],
};

// ── Helper: resolve coordinates from a job's location object ────────────────
function resolveCoords(location) {
  if (!location) return null;

  const city   = (location.city   || '').toLowerCase().trim();
  const region = (location.region || '').toLowerCase().trim();

  // Try city first (more precise), fall back to region centre
  return CITY_COORDS[city] || REGION_CENTERS[region] || null;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI not set in environment. Exiting.');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log('✅  Connected\n');

  // Find all jobs that have no coordinates yet
  const jobs = await Job.find({
    $or: [
      { 'location.coordinates': { $exists: false } },
      { 'location.coordinates.coordinates': { $size: 0 } },
      { 'location.coordinates': null }
    ]
  }).lean();

  console.log(`📋  Found ${jobs.length} jobs without coordinates\n`);

  let updated  = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const job of jobs) {
    try {
      const coords = resolveCoords(job.location);

      if (!coords) {
        skipped++;
        if (skipped <= 5) {
          console.warn(`⚠️   Skipped (no match): "${job.location?.city}" / "${job.location?.region}" — job ${job._id}`);
        }
        continue;
      }

      await Job.updateOne(
        { _id: job._id },
        {
          $set: {
            'location.coordinates': {
              type:        'Point',
              coordinates: coords   // [lng, lat]
            }
          }
        }
      );

      updated++;

      if (updated % 50 === 0) {
        console.log(`   … updated ${updated} jobs so far`);
      }
    } catch (err) {
      errors++;
      console.error(`❌  Error updating job ${job._id}:`, err.message);
    }
  }

  console.log(`\n📊  Migration complete:`);
  console.log(`   ✅  Updated : ${updated}`);
  console.log(`   ⚠️   Skipped : ${skipped}  (city/region not in lookup table)`);
  console.log(`   ❌  Errors  : ${errors}`);

  if (skipped > 0) {
    console.log(`\n💡  To cover skipped jobs, add their city/region to CITY_COORDS in this script and re-run.`);
  }

  await mongoose.disconnect();
  console.log('\n🔌  Disconnected. Done.');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});