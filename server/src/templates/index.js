// backend/src/templates/index.js — All 20 CV templates

module.exports = {
  // ── Original 10 ──────────────────────────────────────────────
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

  // ── New 10 ───────────────────────────────────────────────────
  startup:      require('./template11_startup'),
  minimal:      require('./template12_minimal'),
  geometric:    require('./template13_geometric'),
  timeline:     require('./template14_timeline'),
  nordic:       require('./template15_nordic'),
  impact:       require('./template16_impact'),
  retro:        require('./template17_retro'),
  healthcare:   require('./template18_medical'),
  magazine:     require('./template19_magazine'),
  glass:        require('./template20_glassmorphism'),
};