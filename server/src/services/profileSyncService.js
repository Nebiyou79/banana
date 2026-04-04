// server/src/services/profileSyncService.js
const User = require('../models/User');
const Profile = require('../models/Profile');
const Company = require('../models/Company');
const Organization = require('../models/Organization');

class ProfileSyncService {
  /**
   * Sync user's profile avatar to their company/organization
   * This should be called when user uploads a new avatar
   */
  static async syncAvatarToEntity(userId) {
    try {
      console.log(`🔄 Syncing avatar for user: ${userId}`);
      
      const user = await User.findById(userId)
        .populate('profile', 'avatar')
        .populate('company')
        .populate('organization');
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get avatar URL from profile
      let avatarUrl = null;
      if (user.profile?.avatar) {
        if (typeof user.profile.avatar === 'object' && user.profile.avatar.secure_url) {
          avatarUrl = user.profile.avatar.secure_url;
        } else if (typeof user.profile.avatar === 'string') {
          avatarUrl = user.profile.avatar;
        }
      }
      
      if (!avatarUrl) {
        console.log('ℹ️ No avatar found in profile');
        return { synced: false, message: 'No avatar found' };
      }
      
      let syncedEntities = [];
      
      // Sync to Company if exists
      if (user.role === 'company' && user.company) {
        const company = await Company.findById(user.company._id || user.company);
        if (company) {
          // Update company with profile reference
          company.userProfile = user.profile?._id;
          await company.save();
          syncedEntities.push('company');
          console.log(`✅ Synced avatar to company: ${company._id}`);
        }
      }
      
      // Sync to Organization if exists
      if (user.role === 'organization' && user.organization) {
        const organization = await Organization.findById(user.organization._id || user.organization);
        if (organization) {
          // Update organization with profile reference
          organization.userProfile = user.profile?._id;
          await organization.save();
          syncedEntities.push('organization');
          console.log(`✅ Synced avatar to organization: ${organization._id}`);
        }
      }
      
      return {
        synced: syncedEntities.length > 0,
        entities: syncedEntities,
        avatarUrl
      };
    } catch (error) {
      console.error('❌ Error syncing avatar:', error);
      throw error;
    }
  }
  
  /**
   * Get logo URL for any entity (user/company/organization)
   * Always returns profile avatar as primary, legacy logo as fallback
   */
  static async getLogoUrl(entityId, entityType = 'user') {
    try {
      let logoUrl = null;
      
      switch (entityType) {
        case 'company':
          const company = await Company.findById(entityId)
            .populate({
              path: 'userProfile',
              select: 'avatar'
            });
          
          if (company) {
            // Primary: Profile avatar
            if (company.userProfile?.avatar?.secure_url) {
              logoUrl = company.userProfile.avatar.secure_url;
            }
            // Fallback: Legacy logo
            else if (company.logoUrl) {
              if (company.logoUrl.startsWith('http')) {
                logoUrl = company.logoUrl;
              } else {
                logoUrl = `${process.env.BASE_URL || 'http://localhost:4000'}${company.logoUrl}`;
              }
            }
          }
          break;
          
        case 'organization':
          const organization = await Organization.findById(entityId)
            .populate({
              path: 'userProfile',
              select: 'avatar'
            });
          
          if (organization) {
            // Primary: Profile avatar
            if (organization.userProfile?.avatar?.secure_url) {
              logoUrl = organization.userProfile.avatar.secure_url;
            }
            // Fallback: Legacy logo
            else if (organization.logoUrl) {
              if (organization.logoUrl.startsWith('http')) {
                logoUrl = organization.logoUrl;
              } else {
                logoUrl = `${process.env.BASE_URL || 'http://localhost:4000'}${organization.logoUrl}`;
              }
            }
          }
          break;
          
        case 'user':
        default:
          const user = await User.findById(entityId)
            .populate('profile', 'avatar');
          
          if (user?.profile?.avatar?.secure_url) {
            logoUrl = user.profile.avatar.secure_url;
          } else if (user?.avatar) {
            logoUrl = user.avatar;
          }
          break;
      }
      
      return logoUrl;
    } catch (error) {
      console.error('❌ Error getting logo URL:', error);
      return null;
    }
  }
  
  /**
   * Batch sync for all companies/organizations
   * Useful for migration or fixing broken references
   */
  static async batchSyncProfiles() {
    try {
      console.log('🔄 Starting batch profile sync...');
      
      // Sync all companies
      const companies = await Company.find({ userProfile: { $exists: false } })
        .populate('user', 'profile');
      
      let companyCount = 0;
      for (const company of companies) {
        if (company.user?.profile) {
          company.userProfile = company.user.profile._id;
          await company.save();
          companyCount++;
        }
      }
      
      // Sync all organizations
      const organizations = await Organization.find({ userProfile: { $exists: false } })
        .populate('user', 'profile');
      
      let orgCount = 0;
      for (const organization of organizations) {
        if (organization.user?.profile) {
          organization.userProfile = organization.user.profile._id;
          await organization.save();
          orgCount++;
        }
      }
      
      console.log(`✅ Batch sync completed: ${companyCount} companies, ${orgCount} organizations`);
      
      return {
        companiesSynced: companyCount,
        organizationsSynced: orgCount
      };
    } catch (error) {
      console.error('❌ Batch sync error:', error);
      throw error;
    }
  }
}

module.exports = ProfileSyncService;