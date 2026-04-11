// backend/src/utils/cvTemplateRenderer.js
// Merges candidate profile data with a template and returns a complete HTML document.

const templates = require('../templates');

/**
 * Render a template with candidate data.
 * @param {string} templateId   - One of the template IDs exported from templates/index.js
 * @param {object} candidateData - Normalised candidate profile data
 * @returns {string}            - Complete HTML document string
 */
function renderTemplate(templateId, candidateData) {
  const template = templates[templateId];
  if (!template) {
    throw new Error(`CV template "${templateId}" not found. Available: ${Object.keys(templates).join(', ')}`);
  }
  return template.render(candidateData);
}

/**
 * List all available template metadata (id, name, description, thumbnail colour).
 */
function listTemplates() {
  return Object.entries(templates).map(([id, tpl]) => ({
    id,
    name: tpl.name,
    description: tpl.description,
    primaryColor: tpl.primaryColor,
    style: tpl.style,   // e.g. "modern", "classic", "creative", etc.
    thumbnailGradient: tpl.thumbnailGradient,
  }));
}

module.exports = { renderTemplate, listTemplates };