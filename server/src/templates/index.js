// backend/src/templates/index.js
// ─────────────────────────────────────────────────────────────────────────────
// Central registry for all CV templates.
// cvTemplateRenderer.js does:  const templates = require('../templates');
// So this file MUST export an object keyed by template ID.
//
// Drop this file at:  backend/src/templates/index.js
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  executive:    require('./template01_executive'),
  modern:       require('./template02_modern'),
  creative:     require('./template03_creative'),
  professional: require('./template04_professional'),
  elegant:      require('./template05_elegant'),
  tech:         require('./template06_tech'),
  infographic:  require('./template07_infographic'),
  compact:      require('./template08_compact'),
  academic:     require('./template09_academic'),
  freelancer:   require('./template10_freelancer'),
};