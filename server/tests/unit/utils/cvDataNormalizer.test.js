const { normalizeCandidateData } = require('../../../src/utils/cvDataNormalizer');

describe('cvDataNormalizer', () => {
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
});
