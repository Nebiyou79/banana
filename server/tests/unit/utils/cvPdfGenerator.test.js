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
      experience: [
        {
          company: 'Acme Corp',
          position: 'Backend Engineer',
          startDate: 'Jan 2020',
          endDate: 'Present',
          description: 'Built APIs and services.',
        },
      ],
      education: [
        {
          institution: 'State University',
          degree: 'BSc',
          field: 'Computer Science',
          startDate: '2016',
          endDate: '2020',
        },
      ],
      certifications: [{ name: 'AWS Certified', issuer: 'Amazon' }],
      portfolio: [{ title: 'Portfolio Site', description: 'Personal site' }],
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

  it('generates PDF with social links and empty optional sections', async () => {
    const outputPath = path.join(os.tmpdir(), `cv-test-social-${Date.now()}.pdf`);
    const cvData = {
      fullName: 'John Smith',
      headline: 'Full Stack Developer',
      email: 'john@example.com',
      phone: '+251911000000',
      location: 'Addis Ababa',
      website: 'https://johnsmith.dev',
      bio: 'Full stack engineer.',
      social: {
        linkedin: 'https://linkedin.com/in/johnsmith',
        github: 'https://github.com/johnsmith',
      },
      skills: ['React', 'Node.js'],
      experience: [],
      education: [],
      certifications: [],
      portfolio: [],
      totalExperienceYears: 3,
      generatedAt: 'August 7, 2026',
    };

    await htmlToPdf('<html><body><h1>John Smith</h1></body></html>', outputPath, cvData);

    const buffer = fs.readFileSync(outputPath);
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');
    fs.unlinkSync(outputPath);
  });
});
