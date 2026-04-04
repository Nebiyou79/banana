// routes/searchRoutes.js
const express = require('express');
const { searchJobs } = require('../controllers/searchController');

const router = express.Router();

router.get('/jobs', searchJobs);

module.exports = router;