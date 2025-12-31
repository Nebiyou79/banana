const Profile = require('../models/Profile');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// ========== HELPER FUNCTIONS (DEFINED OUTSIDE THE CLASS) ==========

// Validate education
const validateEducation = (education) => {
  if (!Array.isArray(education)) return [];
  
  return education.map(edu => ({
    institution: edu.institution?.trim() || '',
    degree: edu.degree?.trim() || '',
    field: edu.field?.trim() || '',
    startDate: edu.startDate ? new Date(edu.startDate) : new Date(),
    endDate: edu.endDate ? new Date(edu.endDate) : null,
    current: edu.current || false,
    description: edu.description?.trim().substring(0, 500) || '',
    grade: edu.grade?.trim() || ''
  })).filter(edu => edu.institution && edu.degree);
};

// Validate experience
const validateExperience = (experience) => {
  if (!Array.isArray(experience)) return [];
  
  return experience.map(exp => ({
    company: exp.company?.trim() || '',
    position: exp.position?.trim() || '',
    location: exp.location?.trim() || '',
    employmentType: exp.employmentType || 'full-time',
    startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
    endDate: exp.endDate ? new Date(exp.endDate) : null,
    current: exp.current || false,
    description: exp.description?.trim().substring(0, 1000) || '',
    skills: Array.isArray(exp.skills) ? exp.skills.filter(skill => skill && skill.trim()) : [],
    achievements: Array.isArray(exp.achievements) ? exp.achievements.filter(achievement => achievement && achievement.trim()) : []
  })).filter(exp => exp.company && exp.position);
};

// Validate certifications
const validateCertifications = (certifications) => {
  if (!Array.isArray(certifications)) return [];
  
  return certifications.map(cert => ({
    name: cert.name?.trim() || '',
    issuer: cert.issuer?.trim() || '',
    issueDate: cert.issueDate ? new Date(cert.issueDate) : new Date(),
    expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
    credentialId: cert.credentialId?.trim() || '',
    credentialUrl: cert.credentialUrl?.trim() || '',
    description: cert.description?.trim().substring(0, 500) || ''
  })).filter(cert => cert.name && cert.issuer);
};

// Validate portfolio
const validatePortfolio = (portfolio) => {
  if (!Array.isArray(portfolio)) return [];
  
  return portfolio.map(project => ({
    title: project.title?.trim() || '',
    description: project.description?.trim().substring(0, 1000) || '',
    mediaUrl: project.mediaUrl?.trim() || '',
    projectUrl: project.projectUrl?.trim() || '',
    category: project.category?.trim() || '',
    technologies: Array.isArray(project.technologies) ? project.technologies.filter(tech => tech && tech.trim()) : [],
    budget: typeof project.budget === 'number' ? Math.max(0, project.budget) : 0,
    duration: project.duration?.trim() || '',
    client: project.client?.trim() || '',
    completionDate: project.completionDate ? new Date(project.completionDate) : null,
    teamSize: typeof project.teamSize === 'number' ? Math.max(1, project.teamSize) : 1,
    role: project.role?.trim() || ''
  })).filter(project => project.title);
};

// ========== ROLE PROFILE CONTROLLER CLASS ==========

class RoleProfileController {
  // Get candidate profile
  async getCandidateProfile(req, res) {
    try {
      const profile = await Profile.findOne({ user: req.user.userId })
        .populate('user', 'name email role avatar coverPhoto');

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      // Check if user is a candidate
      if (profile.user.role !== 'candidate') {
        return res.status(403).json({
          success: false,
          message: 'This endpoint is only for candidates',
          code: 'ROLE_MISMATCH'
        });
      }

      // Extract candidate-specific data
      const candidateData = {
        skills: profile.roleSpecific.skills || [],
        education: profile.roleSpecific.education || [],
        experience: profile.roleSpecific.experience || [],
        certifications: profile.roleSpecific.certifications || [],
        languages: profile.languages || [],
        interests: profile.interests || [],
        awards: profile.awards || [],
        volunteerExperience: profile.volunteerExperience || []
      };

      res.status(200).json({
        success: true,
        data: candidateData,
        message: 'Candidate profile retrieved successfully',
        code: 'CANDIDATE_PROFILE_RETRIEVED'
      });
    } catch (error) {
      console.error('Get candidate profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching candidate profile',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Update candidate profile
  async updateCandidateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { skills, education, experience, certifications, languages, interests, awards, volunteerExperience } = req.body;

      // Get user to check role
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user is a candidate
      if (user.role !== 'candidate') {
        return res.status(403).json({
          success: false,
          message: 'This endpoint is only for candidates',
          code: 'ROLE_MISMATCH'
        });
      }

      // Find or create profile
      let profile = await Profile.findOne({ user: req.user.userId });
      
      if (!profile) {
        profile = new Profile({ user: req.user.userId });
      }

      // Update candidate-specific fields
      if (skills !== undefined) {
        profile.roleSpecific.skills = Array.isArray(skills) 
          ? skills.slice(0, 50).filter(skill => skill && skill.trim().length > 0)
          : [];
      }

      if (education !== undefined) {
        profile.roleSpecific.education = validateEducation(education);
      }

      if (experience !== undefined) {
        profile.roleSpecific.experience = validateExperience(experience);
      }

      if (certifications !== undefined) {
        profile.roleSpecific.certifications = validateCertifications(certifications);
      }

      if (languages !== undefined) {
        profile.languages = Array.isArray(languages) 
          ? languages.filter(lang => lang.language && lang.proficiency).slice(0, 10)
          : [];
      }

      if (interests !== undefined) {
        profile.interests = Array.isArray(interests) 
          ? interests.filter(interest => interest && interest.trim()).slice(0, 20)
          : [];
      }

      if (awards !== undefined) {
        profile.awards = Array.isArray(awards) 
          ? awards.filter(award => award.title && award.issuer).slice(0, 20)
          : [];
      }

      if (volunteerExperience !== undefined) {
        profile.volunteerExperience = Array.isArray(volunteerExperience) 
          ? volunteerExperience.filter(vol => vol.organization && vol.role).slice(0, 20)
          : [];
      }

      // Update timestamps
      profile.lastProfileUpdate = new Date();
      profile.lastActive = new Date();

      await profile.save();
      await profile.populate('user', 'name email role avatar');

      res.status(200).json({
        success: true,
        message: 'Candidate profile updated successfully',
        data: {
          skills: profile.roleSpecific.skills,
          education: profile.roleSpecific.education,
          experience: profile.roleSpecific.experience,
          certifications: profile.roleSpecific.certifications,
          languages: profile.languages,
          interests: profile.interests,
          awards: profile.awards,
          volunteerExperience: profile.volunteerExperience,
          profileCompletion: profile.profileCompletion
        },
        code: 'CANDIDATE_PROFILE_UPDATED'
      });
    } catch (error) {
      console.error('Update candidate profile error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating candidate profile',
        code: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get company profile
  async getCompanyProfile(req, res) {
    try {
      const profile = await Profile.findOne({ user: req.user.userId })
        .populate('user', 'name email role avatar coverPhoto');

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      // Check if user is a company
      if (profile.user.role !== 'company') {
        return res.status(403).json({
          success: false,
          message: 'This endpoint is only for companies',
          code: 'ROLE_MISMATCH'
        });
      }

      // Extract company-specific data
      const companyData = {
        companyInfo: profile.roleSpecific.companyInfo || {},
        specialties: profile.roleSpecific.companyInfo?.specialties || [],
        mission: profile.roleSpecific.companyInfo?.mission || '',
        values: profile.roleSpecific.companyInfo?.values || [],
        culture: profile.roleSpecific.companyInfo?.culture || '',
        portfolio: profile.roleSpecific.portfolio || []
      };

      res.status(200).json({
        success: true,
        data: companyData,
        message: 'Company profile retrieved successfully',
        code: 'COMPANY_PROFILE_RETRIEVED'
      });
    } catch (error) {
      console.error('Get company profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching company profile',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Update company profile
  async updateCompanyProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { companyInfo, portfolio } = req.body;

      // Get user to check role
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user is a company
      if (user.role !== 'company') {
        return res.status(403).json({
          success: false,
          message: 'This endpoint is only for companies',
          code: 'ROLE_MISMATCH'
        });
      }

      // Find or create profile
      let profile = await Profile.findOne({ user: req.user.userId });
      
      if (!profile) {
        profile = new Profile({ user: req.user.userId });
      }

      // Update company info
      if (companyInfo !== undefined) {
        profile.roleSpecific.companyInfo = { 
          ...profile.roleSpecific.companyInfo, 
          ...companyInfo 
        };
      }

      // Update portfolio
      if (portfolio !== undefined) {
        profile.roleSpecific.portfolio = validatePortfolio(portfolio);
      }

      // Update timestamps
      profile.lastProfileUpdate = new Date();
      profile.lastActive = new Date();

      await profile.save();
      await profile.populate('user', 'name email role avatar');

      res.status(200).json({
        success: true,
        message: 'Company profile updated successfully',
        data: {
          companyInfo: profile.roleSpecific.companyInfo,
          portfolio: profile.roleSpecific.portfolio,
          profileCompletion: profile.profileCompletion
        },
        code: 'COMPANY_PROFILE_UPDATED'
      });
    } catch (error) {
      console.error('Update company profile error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating company profile',
        code: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get freelancer profile
  async getFreelancerProfile(req, res) {
    try {
      const profile = await Profile.findOne({ user: req.user.userId })
        .populate('user', 'name email role avatar coverPhoto');

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      // Check if user is a freelancer
      if (profile.user.role !== 'freelancer') {
        return res.status(403).json({
          success: false,
          message: 'This endpoint is only for freelancers',
          code: 'ROLE_MISMATCH'
        });
      }

      // Extract freelancer-specific data
      const freelancerData = {
        skills: profile.roleSpecific.skills || [],
        education: profile.roleSpecific.education || [],
        experience: profile.roleSpecific.experience || [],
        certifications: profile.roleSpecific.certifications || [],
        portfolio: profile.roleSpecific.portfolio || [],
        languages: profile.languages || [],
        interests: profile.interests || [],
        awards: profile.awards || [],
        volunteerExperience: profile.volunteerExperience || []
      };

      res.status(200).json({
        success: true,
        data: freelancerData,
        message: 'Freelancer profile retrieved successfully',
        code: 'FREELANCER_PROFILE_RETRIEVED'
      });
    } catch (error) {
      console.error('Get freelancer profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching freelancer profile',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Update freelancer profile
  async updateFreelancerProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { skills, education, experience, certifications, portfolio, languages, interests, awards, volunteerExperience } = req.body;

      // Get user to check role
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user is a freelancer
      if (user.role !== 'freelancer') {
        return res.status(403).json({
          success: false,
          message: 'This endpoint is only for freelancers',
          code: 'ROLE_MISMATCH'
        });
      }

      // Find or create profile
      let profile = await Profile.findOne({ user: req.user.userId });
      
      if (!profile) {
        profile = new Profile({ user: req.user.userId });
      }

      // Update freelancer-specific fields
      if (skills !== undefined) {
        profile.roleSpecific.skills = Array.isArray(skills) 
          ? skills.slice(0, 50).filter(skill => skill && skill.trim().length > 0)
          : [];
      }

      if (education !== undefined) {
        profile.roleSpecific.education = validateEducation(education);
      }

      if (experience !== undefined) {
        profile.roleSpecific.experience = validateExperience(experience);
      }

      if (certifications !== undefined) {
        profile.roleSpecific.certifications = validateCertifications(certifications);
      }

      if (portfolio !== undefined) {
        profile.roleSpecific.portfolio = validatePortfolio(portfolio);
      }

      if (languages !== undefined) {
        profile.languages = Array.isArray(languages) 
          ? languages.filter(lang => lang.language && lang.proficiency).slice(0, 10)
          : [];
      }

      if (interests !== undefined) {
        profile.interests = Array.isArray(interests) 
          ? interests.filter(interest => interest && interest.trim()).slice(0, 20)
          : [];
      }

      if (awards !== undefined) {
        profile.awards = Array.isArray(awards) 
          ? awards.filter(award => award.title && award.issuer).slice(0, 20)
          : [];
      }

      if (volunteerExperience !== undefined) {
        profile.volunteerExperience = Array.isArray(volunteerExperience) 
          ? volunteerExperience.filter(vol => vol.organization && vol.role).slice(0, 20)
          : [];
      }

      // Update timestamps
      profile.lastProfileUpdate = new Date();
      profile.lastActive = new Date();

      await profile.save();
      await profile.populate('user', 'name email role avatar');

      res.status(200).json({
        success: true,
        message: 'Freelancer profile updated successfully',
        data: {
          skills: profile.roleSpecific.skills,
          education: profile.roleSpecific.education,
          experience: profile.roleSpecific.experience,
          certifications: profile.roleSpecific.certifications,
          portfolio: profile.roleSpecific.portfolio,
          languages: profile.languages,
          interests: profile.interests,
          awards: profile.awards,
          volunteerExperience: profile.volunteerExperience,
          profileCompletion: profile.profileCompletion
        },
        code: 'FREELANCER_PROFILE_UPDATED'
      });
    } catch (error) {
      console.error('Update freelancer profile error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating freelancer profile',
        code: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get organization profile
  async getOrganizationProfile(req, res) {
    try {
      const profile = await Profile.findOne({ user: req.user.userId })
        .populate('user', 'name email role avatar coverPhoto');

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      // Check if user is an organization
      if (profile.user.role !== 'organization') {
        return res.status(403).json({
          success: false,
          message: 'This endpoint is only for organizations',
          code: 'ROLE_MISMATCH'
        });
      }

      // Extract organization-specific data
      const organizationData = {
        companyInfo: profile.roleSpecific.companyInfo || {},
        specialties: profile.roleSpecific.companyInfo?.specialties || [],
        mission: profile.roleSpecific.companyInfo?.mission || '',
        values: profile.roleSpecific.companyInfo?.values || [],
        culture: profile.roleSpecific.companyInfo?.culture || '',
        portfolio: profile.roleSpecific.portfolio || []
      };

      res.status(200).json({
        success: true,
        data: organizationData,
        message: 'Organization profile retrieved successfully',
        code: 'ORGANIZATION_PROFILE_RETRIEVED'
      });
    } catch (error) {
      console.error('Get organization profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching organization profile',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Update organization profile
  async updateOrganizationProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { companyInfo, portfolio } = req.body;

      // Get user to check role
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user is an organization
      if (user.role !== 'organization') {
        return res.status(403).json({
          success: false,
          message: 'This endpoint is only for organizations',
          code: 'ROLE_MISMATCH'
        });
      }

      // Find or create profile
      let profile = await Profile.findOne({ user: req.user.userId });
      
      if (!profile) {
        profile = new Profile({ user: req.user.userId });
      }

      // Update company info for organization
      if (companyInfo !== undefined) {
        profile.roleSpecific.companyInfo = { 
          ...profile.roleSpecific.companyInfo, 
          ...companyInfo 
        };
      }

      // Update portfolio
      if (portfolio !== undefined) {
        profile.roleSpecific.portfolio = validatePortfolio(portfolio);
      }

      // Update timestamps
      profile.lastProfileUpdate = new Date();
      profile.lastActive = new Date();

      await profile.save();
      await profile.populate('user', 'name email role avatar');

      res.status(200).json({
        success: true,
        message: 'Organization profile updated successfully',
        data: {
          companyInfo: profile.roleSpecific.companyInfo,
          portfolio: profile.roleSpecific.portfolio,
          profileCompletion: profile.profileCompletion
        },
        code: 'ORGANIZATION_PROFILE_UPDATED'
      });
    } catch (error) {
      console.error('Update organization profile error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating organization profile',
        code: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new RoleProfileController();