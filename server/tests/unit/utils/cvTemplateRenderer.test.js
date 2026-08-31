const { renderTemplate, listTemplates } = require('../../../src/utils/cvTemplateRenderer');

describe('cvTemplateRenderer', () => {
  const candidateData = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    headline: 'Engineer',
    bio: 'Short bio',
    skills: ['Node.js'],
    education: [],
    experience: [],
    certifications: [],
    portfolio: [],
    social: {},
    generatedAt: 'August 6, 2026',
  };

  it('lists available templates with metadata', () => {
    const templates = listTemplates();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });

  it('renders a known template to HTML', () => {
    const html = renderTemplate('modern', candidateData);
    expect(typeof html).toBe('string');
    expect(html).toContain('Jane Doe');
  });

  it('throws for unknown template ids', () => {
    expect(() => renderTemplate('does-not-exist', candidateData)).toThrow(/CV template "does-not-exist" not found/);
  });
});
