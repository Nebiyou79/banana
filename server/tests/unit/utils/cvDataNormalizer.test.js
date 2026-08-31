const http = require('http');
const { normalizeCandidateData } = require('../../../src/utils/cvDataNormalizer');

describe('cvDataNormalizer', () => {
  let server;
  let avatarUrl;

  beforeAll((done) => {
    server = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(Buffer.from('fake-image-bytes'));
    });
    server.listen(0, () => {
      const { port } = server.address();
      avatarUrl = `http://127.0.0.1:${port}/avatar.jpg`;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('throws when user data is missing', async () => {
    await expect(normalizeCandidateData(null)).rejects.toThrow('User data is required');
  });

  it('normalizes core profile fields', async () => {
    const result = await normalizeCandidateData({
      name: '  Jane Doe  ',
      email: 'jane@example.com',
      phone: '+1234567890',
      location: 'Addis Ababa',
      headline: 'Backend Engineer',
      bio: 'Experienced developer',
      skills: ['Node.js', '', 'MongoDB'],
      education: [],
      experience: [],
      certifications: [],
      portfolio: [],
    });

    expect(result.fullName).toBe('Jane Doe');
    expect(result.email).toBe('jane@example.com');
    expect(result.skills).toEqual(['Node.js', 'MongoDB']);
    expect(result.avatar).toBeNull();
    expect(result.generatedAt).toBeTruthy();
  });

  it('excludes private portfolio items', async () => {
    const result = await normalizeCandidateData({
      name: 'Jane Doe',
      portfolio: [
        { title: 'Public Project', visibility: 'public' },
        { title: 'Private Project', visibility: 'private' },
      ],
    });

    expect(result.portfolio).toHaveLength(1);
    expect(result.portfolio[0].title).toBe('Public Project');
  });

  it('normalizes education, experience, and certifications', async () => {
    const result = await normalizeCandidateData({
      name: 'Jane Doe',
      education: [
        {
          institution: 'University',
          degree: 'BSc',
          field: 'CS',
          startDate: '2018-01-01',
          endDate: '2022-06-01',
          current: false,
          grade: 'A',
        },
      ],
      experience: [
        {
          company: 'Acme',
          position: 'Engineer',
          startDate: '2022-07-01',
          endDate: null,
          current: true,
          skills: ['Node.js'],
          achievements: ['Shipped v1'],
        },
      ],
      certifications: [
        {
          name: 'AWS',
          issuer: 'Amazon',
          issueDate: '2023-01-01',
          credentialId: 'ABC123',
        },
      ],
    });

    expect(result.education[0].institution).toBe('University');
    expect(result.experience[0].endDate).toBe('Present');
    expect(result.experience[0].current).toBe(true);
    expect(result.certifications[0].name).toBe('AWS');
    expect(result.totalExperienceYears).toBeGreaterThan(0);
  });

  it('embeds avatar as data URI when URL is reachable', async () => {
    const result = await normalizeCandidateData({
      name: 'Jane Doe',
      avatar: avatarUrl,
    });

    expect(result.avatar).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('cleans social links and keeps public portfolio media', async () => {
    const result = await normalizeCandidateData({
      name: 'Jane Doe',
      socialLinks: {
        linkedin: 'linkedin.com/in/jane',
        github: 'https://github.com/jane',
      },
      portfolio: [
        {
          title: 'App',
          visibility: 'public',
          mediaUrls: ['https://example.com/app.png'],
          technologies: ['React'],
        },
      ],
    });

    expect(result.social.linkedin).toBe('https://linkedin.com/in/jane');
    expect(result.social.github).toBe('https://github.com/jane');
    expect(result.portfolio[0].mediaUrl).toBe('https://example.com/app.png');
  });
});
