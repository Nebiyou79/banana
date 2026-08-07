const fs = require('fs');
const os = require('os');
const path = require('path');
const { htmlToPdf } = require('../../../src/utils/cvPdfGenerator');

describe('cvPdfGenerator', () => {
  it('writes a valid PDF using the structured fallback renderer', async () => {
    const outputPath = path.join(os.tmpdir(), `cv-test-${Date.now()}.pdf`);
    const cvData = {
      fullName: 'Jane Doe',
      headline: 'Software Engineer',
      email: 'jane@example.com',
      bio: 'Experienced developer with a focus on backend systems.',
      skills: ['Node.js', 'MongoDB'],
      experience: [],
      education: [],
      certifications: [],
      portfolio: [],
      generatedAt: 'August 6, 2026',
    };

    const resultPath = await htmlToPdf('<html><body><h1>Jane Doe</h1></body></html>', outputPath, cvData);

    expect(resultPath).toBe(outputPath);
    const buffer = fs.readFileSync(outputPath);
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(500);

    fs.unlinkSync(outputPath);
  });

  it('returns the output path even when wkhtmltopdf is unavailable', async () => {
    const outputPath = path.join(os.tmpdir(), `cv-test-minimal-${Date.now()}.pdf`);
    await htmlToPdf('<html><body>Hello</body></html>', outputPath, { fullName: 'Test User' });
    expect(fs.existsSync(outputPath)).toBe(true);
    fs.unlinkSync(outputPath);
  });
});
