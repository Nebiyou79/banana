const User = require('../models/User');
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const Company = require('../models/Company');
const Organization = require('../models/Organization');
const Hashtag = require('../models/social/Hashtag');
const createError = require('http-errors');

// Utility function for pagination
const getPagination = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;
  
  return { page: pageNum, limit: limitNum, skip };
};
exports.searchProfiles = async (req, res, next) => {
  try {
    const { 
      q, type, industry, location, skills, 
      minFollowers, maxFollowers, verificationStatus,
      page = 1, limit = 20, sortBy = 'relevance' 
    } = req.query;
    
    const { skip, page: pageNum, limit: limitNum } = getPagination(page, limit);

    console.log('Search profiles called with:', { 
      q, type, industry, location, skills, page, limit, sortBy 
    });

    // Determine entity type to search
    let Model;
    let baseQuery = {};
    let selectFields = '';
    let searchType = type || 'all';
    
    switch(searchType) {
      case 'company':
        Model = Company;
        // Company doesn't have isActive - use different criteria
        baseQuery = { 
          'settings.profileVisibility': 'public'  // Or just empty query to get all
        };
        selectFields = 'name logoUrl industry description address phone website verified user socialStats companySize foundedYear companyType socialLinks settings tags featured';
        console.log('Searching in Company collection');
        break;
      case 'organization':
        Model = Organization;
        // Check if Organization has isActive field
        baseQuery = {};
        selectFields = 'name logoUrl organizationType description headquarters website memberCount socialStats createdAt';
        console.log('Searching in Organization collection');
        break;
      case 'candidate':
      case 'freelancer':
      case 'user':
        // For specific user types
        Model = User;
        baseQuery = { 
          isActive: true,
          role: searchType
        };
        selectFields = 'name avatar headline role verificationStatus socialStats skills location bio socialLinks createdAt isActive';
        console.log('Searching in User collection for role:', searchType);
        break;
      default:
        // For 'all' or unspecified type, search all user types
        Model = User;
        baseQuery = { 
          isActive: true,
          role: { $in: ['candidate', 'freelancer', 'user'] }
        };
        selectFields = 'name avatar headline role verificationStatus socialStats skills location bio socialLinks createdAt isActive';
        console.log('Searching in User collection for all user roles');
        break;
    }

    // Build query for text search
    const orConditions = [];
    if (q && q.trim().length > 0) {
      const searchRegex = { $regex: q.trim(), $options: 'i' };
      const cleanQ = q.trim();
      
      console.log('Building search for query:', cleanQ);
      
      // Different search fields based on model type
      if (Model === User) {
        orConditions.push(
          { name: searchRegex },
          { headline: searchRegex },
          { bio: searchRegex },
          { location: searchRegex },
          { 'roleSpecific.position': searchRegex },
          { 'roleSpecific.companyInfo.name': searchRegex }
        );
      } else if (Model === Company) {
        // Company search fields based on your schema
        orConditions.push(
          { name: searchRegex },
          { description: searchRegex },
          { industry: searchRegex },
          { address: searchRegex },
          { headline: searchRegex },
          { mission: searchRegex },
          { tags: searchRegex }
        );
      } else if (Model === Organization) {
        orConditions.push(
          { name: searchRegex },
          { description: searchRegex },
          { organizationType: searchRegex },
          { headquarters: searchRegex },
          { 'contactInfo.email': searchRegex }
        );
      }
      
      console.log('OR conditions:', orConditions.length);
    }

    // Add OR conditions if any exist
    if (orConditions.length > 0) {
      baseQuery.$or = orConditions;
    }

    // Apply additional filters based on entity type
    if (Model === User) {
      // Skills filter for users
      if (skills) {
        const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
        const cleanSkills = skillsArray.map(skill => skill.trim().toLowerCase());
        baseQuery.skills = { $in: cleanSkills.map(skill => new RegExp(skill, 'i')) };
        console.log('Filtering by skills:', cleanSkills);
      }

      // Location filter
      if (location) {
        baseQuery.location = { $regex: location, $options: 'i' };
        console.log('Filtering by location:', location);
      }

      // Followers filter
      if (minFollowers || maxFollowers) {
        baseQuery['socialStats.followerCount'] = {};
        if (minFollowers) {
          baseQuery['socialStats.followerCount'].$gte = parseInt(minFollowers);
          console.log('Min followers:', minFollowers);
        }
        if (maxFollowers) {
          baseQuery['socialStats.followerCount'].$lte = parseInt(maxFollowers);
          console.log('Max followers:', maxFollowers);
        }
      }

      if (verificationStatus) {
        baseQuery.verificationStatus = verificationStatus;
        console.log('Filtering by verification status:', verificationStatus);
      }
    }

    // Industry filter for companies/organizations
    if (industry) {
      if (Model === Company) {
        baseQuery.industry = { $regex: industry, $options: 'i' };
        console.log('Filtering company by industry:', industry);
      } else if (Model === Organization) {
        baseQuery.organizationType = { $regex: industry, $options: 'i' };
        console.log('Filtering organization by type:', industry);
      }
    }

    // For Company, handle verification filter differently
    if (Model === Company && verificationStatus === 'verified') {
      baseQuery.verified = true;
      console.log('Filtering companies by verified status');
    }

    // Sort configuration
    const sortConfig = {};
    switch (sortBy) {
      case 'followers':
        sortConfig['socialStats.followerCount'] = -1;
        console.log('Sorting by followers');
        break;
      case 'recent':
        sortConfig.createdAt = -1;
        console.log('Sorting by recent');
        break;
      case 'alphabetical':
        sortConfig.name = 1;
        console.log('Sorting alphabetically');
        break;
      case 'relevance':
      default:
        // For relevance, sort by verified first, then followers, then recency
        if (Model === Company) {
          sortConfig.verified = -1; // Verified companies first
        }
        sortConfig['socialStats.followerCount'] = -1;
        sortConfig.createdAt = -1;
        console.log('Sorting by relevance');
        break;
    }

    console.log('Final query for', Model.modelName, ':', JSON.stringify(baseQuery, null, 2));
    console.log('Sort config:', sortConfig);
    console.log('Pagination:', { skip, limit: limitNum });

    // Execute query with debug logging
    let results = [];
    let total = 0;
    
    try {
      // For testing, first get all companies to see what's in the database
      if (Model === Company) {
        const allCompanies = await Company.find({}).limit(5).lean();
        console.log('Sample companies in DB:', allCompanies.map(c => ({
          name: c.name,
          verified: c.verified,
          settings: c.settings,
          id: c._id
        })));
      }
      
      results = await Model.find(baseQuery)
        .select(selectFields)
        .sort(sortConfig)
        .skip(skip)
        .limit(limitNum)
        .lean();

      total = await Model.countDocuments(baseQuery);
      
      console.log(`Found ${results.length} results out of ${total} total`);
      if (results.length > 0) {
        console.log('First result:', {
          name: results[0].name,
          id: results[0]._id,
          fields: Object.keys(results[0])
        });
      }
    } catch (dbError) {
      console.error('Database query error:', dbError);
      console.error('Error details:', {
        model: Model.modelName,
        query: baseQuery,
        error: dbError.message,
        stack: dbError.stack
      });
      results = [];
      total = 0;
    }

    // Format response based on entity type
    const formattedResults = results.map(entity => {
      if (Model === User) {
        return {
          _id: entity._id,
          type: entity.role || 'user',
          name: entity.name,
          avatar: entity.avatar,
          headline: entity.headline,
          bio: entity.bio,
          location: entity.location,
          verificationStatus: entity.verificationStatus,
          followerCount: entity.socialStats?.followerCount || 0,
          skills: entity.skills || [],
          socialLinks: entity.socialLinks,
          joinedDate: entity.createdAt,
          position: entity.roleSpecific?.position,
          companyInfo: entity.roleSpecific?.companyInfo,
          isActive: entity.isActive
        };
      } else if (Model === Company) {
        return {
          _id: entity._id,
          type: 'company',
          name: entity.name,
          avatar: entity.logoUrl,
          industry: entity.industry,
          description: entity.description,
          headline: entity.headline,
          mission: entity.mission,
          address: entity.address,
          phone: entity.phone,
          website: entity.website,
          verified: entity.verified,
          followerCount: entity.socialStats?.followerCount || 0,
          postCount: entity.socialStats?.postCount || 0,
          companySize: entity.companySize,
          companyType: entity.companyType,
          foundedYear: entity.foundedYear,
          socialLinks: entity.socialLinks,
          joinedDate: entity.createdAt,
          settings: entity.settings,
          tags: entity.tags || [],
          featured: entity.featured || false
        };
      } else if (Model === Organization) {
        return {
          _id: entity._id,
          type: 'organization',
          name: entity.name,
          avatar: entity.logoUrl,
          organizationType: entity.organizationType,
          description: entity.description,
          headquarters: entity.headquarters,
          website: entity.website,
          memberCount: entity.memberCount,
          followerCount: entity.socialStats?.followerCount || 0,
          joinedDate: entity.createdAt,
          contactInfo: entity.contactInfo,
          socialLinks: entity.socialLinks,
          isActive: entity.isActive
        };
      }
    });

    res.json({
      success: true,
      data: formattedResults,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 0
      },
      filters: {
        q: q || undefined,
        type: type || 'all',
        industry: industry || undefined,
        location: location || undefined,
        verificationStatus: verificationStatus || undefined
      },
      debug: {
        model: Model.modelName,
        queryUsed: process.env.NODE_ENV === 'development' ? baseQuery : undefined,
        resultsCount: results.length
      }
    });

  } catch (error) {
    console.error('Search profiles error:', error);
    console.error('Error stack:', error.stack);
    next(createError(500, 'Error searching profiles: ' + error.message));
  }
};

// Enhanced post search
exports.searchPosts = async (req, res, next) => {
  try {
    const { q, type, hashtag, author, page = 1, limit = 20 } = req.query;
    const { skip, page: pageNum, limit: limitNum } = getPagination(page, limit);

    if (!q && !hashtag && !author) {
      return res.status(400).json({
        success: false,
        message: 'Search query, hashtag, or author required'
      });
    }

    let query = { status: 'active' };

    // Text search
    if (q) {
      query.$or = [
        { content: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } }
      ];
    }

    // Hashtag search
    if (hashtag) {
      const cleanHashtag = hashtag.startsWith('#') ? hashtag.slice(1).toLowerCase() : hashtag.toLowerCase();
      query.hashtags = cleanHashtag;
    }

    // Author search - improved to handle multiple entity types
    if (author) {
      // Try to find author in Users
      const authorUser = await User.findOne({
        $or: [
          { name: { $regex: author, $options: 'i' } },
          { email: { $regex: author, $options: 'i' } }
        ],
        isActive: true
      });
      
      // Try to find in Companies
      const authorCompany = await Company.findOne({
        name: { $regex: author, $options: 'i' },
        isActive: true
      });
      
      // Try to find in Organizations
      const authorOrg = await Organization.findOne({
        name: { $regex: author, $options: 'i' },
        isActive: true
      });

      const authorIds = [];
      if (authorUser) authorIds.push(authorUser._id);
      if (authorCompany) authorIds.push(authorCompany._id);
      if (authorOrg) authorIds.push(authorOrg._id);

      if (authorIds.length > 0) {
        query.author = { $in: authorIds };
      } else {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            pages: 0
          }
        });
      }
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    const posts = await Post.find(query)
      .populate('author', 'name avatar headline role verificationStatus')
      .populate('originalAuthor', 'name avatar headline')
      .sort({ createdAt: -1, 'stats.likes': -1 })
      .skip(skip)
      .limit(limitNum);

    // Get like status for current user if authenticated
    let userLikes = [];
    if (req.user) {
      const Like = require('../models/Like');
      const postIds = posts.map(post => post._id);
      userLikes = await Like.find({
        user: req.user.userId || req.user._id,
        targetType: 'Post',
        targetId: { $in: postIds }
      });
    }

    const postsWithEngagement = posts.map(post => {
      const postObj = post.toObject();
      const userLike = userLikes.find(like => 
        like.targetId && like.targetId.toString() === post._id.toString()
      );
      
      return {
        ...postObj,
        userReaction: userLike ? userLike.reaction : null,
        hasLiked: !!userLike
      };
    });

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: postsWithEngagement,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Search posts error:', error);
    next(createError(500, 'Error searching posts'));
  }
};

// Enhanced trending hashtags
exports.getTrendingHashtags = async (req, res, next) => {
  try {
    const { days = 7, limit = 20 } = req.query;
    const { limit: limitNum } = getPagination(1, limit);

    const date = new Date();
    date.setDate(date.getDate() - parseInt(days));

    const trendingHashtags = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: date },
          status: 'active',
          hashtags: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$hashtags' },
      {
        $group: {
          _id: '$hashtags',
          count: { $sum: 1 },
          recentPosts: { 
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000)] },
                1, 0
              ]
            }
          },
          lastUsed: { $max: '$createdAt' }
        }
      },
      { 
        $project: {
          hashtag: '$_id',
          count: 1,
          recentPosts: 1,
          lastUsed: 1,
          trendingScore: { 
            $add: [
              { $multiply: ['$count', 0.7] },
              { $multiply: ['$recentPosts', 0.3] }
            ]
          }
        }
      },
      { $sort: { trendingScore: -1, count: -1 } },
      { $limit: limitNum }
    ]);

    res.json({
      success: true,
      data: trendingHashtags
    });
  } catch (error) {
    console.error('Get trending hashtags error:', error);
    next(createError(500, 'Error fetching trending hashtags'));
  }
};

// Enhanced search suggestions for all entity types
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = [];
    const searchRegex = { $regex: q, $options: 'i' };

    // User/profile suggestions (candidates, freelancers, users)
    if (type === 'all' || type === 'users' || type === 'profiles') {
      const userSuggestions = await User.find({
        $or: [
          { name: searchRegex },
          { headline: searchRegex },
          { bio: searchRegex }
        ],
        isActive: true,
        role: { $in: ['candidate', 'freelancer', 'user'] }
      })
      .select('name avatar headline role verificationStatus bio skills')
      .limit(5);

      suggestions.push(...userSuggestions.map(user => ({
        type: 'user',
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        subtitle: user.headline || user.bio?.substring(0, 50),
        role: user.role,
        verificationStatus: user.verificationStatus,
        meta: {
          type: user.role,
          skills: user.skills?.slice(0, 3)
        }
      })));
    }

    // Company suggestions
    if (type === 'all' || type === 'companies') {
      const companySuggestions = await Company.find({
        $or: [
          { name: searchRegex },
          { industry: searchRegex },
          { description: searchRegex }
        ],
        isActive: true
      })
      .select('name logoUrl industry description headquarters')
      .limit(5);

      suggestions.push(...companySuggestions.map(company => ({
        type: 'company',
        id: company._id,
        name: company.name,
        avatar: company.logoUrl,
        subtitle: company.industry,
        description: company.description?.substring(0, 80),
        meta: {
          type: 'company',
          location: company.headquarters
        }
      })));
    }

    // Organization suggestions
    if (type === 'all' || type === 'organizations') {
      const orgSuggestions = await Organization.find({
        $or: [
          { name: searchRegex },
          { organizationType: searchRegex },
          { description: searchRegex }
        ],
        isActive: true
      })
      .select('name logoUrl organizationType description headquarters')
      .limit(5);

      suggestions.push(...orgSuggestions.map(org => ({
        type: 'organization',
        id: org._id,
        name: org.name,
        avatar: org.logoUrl,
        subtitle: org.organizationType,
        description: org.description?.substring(0, 80),
        meta: {
          type: 'organization',
          location: org.headquarters
        }
      })));
    }

    // Hashtag suggestions
    if (type === 'all' || type === 'hashtags') {
      const hashtagSuggestions = await Post.aggregate([
        {
          $match: {
            hashtags: searchRegex,
            status: 'active'
          }
        },
        { $unwind: '$hashtags' },
        {
          $match: {
            hashtags: searchRegex
          }
        },
        {
          $group: {
            _id: '$hashtags',
            count: { $sum: 1 },
            lastUsed: { $max: '$createdAt' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      suggestions.push(...hashtagSuggestions.map(tag => ({
        type: 'hashtag',
        id: tag._id,
        name: `#${tag._id}`,
        subtitle: `${tag.count} posts`,
        meta: {
          type: 'hashtag',
          lastUsed: tag.lastUsed
        }
      })));
    }

    // Sort suggestions by relevance
    suggestions.sort((a, b) => {
      // Exact match first
      if (a.name.toLowerCase() === q.toLowerCase()) return -1;
      if (b.name.toLowerCase() === q.toLowerCase()) return 1;
      
      // Starts with query
      const aStartsWith = a.name.toLowerCase().startsWith(q.toLowerCase());
      const bStartsWith = b.name.toLowerCase().startsWith(q.toLowerCase());
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Contains query
      const aContains = a.name.toLowerCase().includes(q.toLowerCase());
      const bContains = b.name.toLowerCase().includes(q.toLowerCase());
      if (aContains && !bContains) return -1;
      if (!aContains && bContains) return 1;
      
      return 0;
    });

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Get search suggestions error:', error);
    next(createError(500, 'Error fetching search suggestions'));
  }
};

// Enhanced global search with improved relevance scoring
exports.globalSearch = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const { skip, page: pageNum, limit: limitNum } = getPagination(page, limit);

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query required'
      });
    }

    const searchQuery = q.trim();
    const searchRegex = { $regex: searchQuery, $options: 'i' };

    // Search across all collections in parallel with improved relevance
    const [users, posts, companies, organizations] = await Promise.all([
      // Users (candidates, freelancers, regular users)
      User.find({
        $or: [
          { name: searchRegex },
          { headline: searchRegex },
          { bio: searchRegex },
          { 'roleSpecific.position': searchRegex },
          { skills: searchRegex }
        ],
        isActive: true,
        role: { $in: ['candidate', 'freelancer', 'user'] }
      })
      .select('name avatar headline role verificationStatus bio skills location')
      .limit(15)
      .lean(),

      // Posts
      Post.find({
        $or: [
          { content: searchRegex },
          { title: searchRegex }
        ],
        status: 'active'
      })
      .populate('author', 'name avatar headline role')
      .select('content title author hashtags createdAt stats')
      .limit(15)
      .lean(),

      // Companies
      Company.find({
        $or: [
          { name: searchRegex },
          { industry: searchRegex },
          { description: searchRegex },
          { headquarters: searchRegex }
        ],
        isActive: true
      })
      .select('name logoUrl industry description headquarters website')
      .limit(15)
      .lean(),

      // Organizations
      Organization.find({
        $or: [
          { name: searchRegex },
          { organizationType: searchRegex },
          { description: searchRegex },
          { headquarters: searchRegex }
        ],
        isActive: true
      })
      .select('name logoUrl organizationType description headquarters website')
      .limit(15)
      .lean()
    ]);

    // Calculate relevance scores
    const results = [];
    
    // Users
    users.forEach(user => {
      let relevance = 0;
      if (user.name.toLowerCase() === searchQuery.toLowerCase()) relevance += 100;
      if (user.name.toLowerCase().startsWith(searchQuery.toLowerCase())) relevance += 50;
      if (user.name.toLowerCase().includes(searchQuery.toLowerCase())) relevance += 30;
      if (user.headline?.toLowerCase().includes(searchQuery.toLowerCase())) relevance += 20;
      if (user.bio?.toLowerCase().includes(searchQuery.toLowerCase())) relevance += 10;
      if (user.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))) relevance += 15;
      
      results.push({
        type: 'profile',
        subtype: user.role,
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        subtitle: user.headline || user.role,
        description: user.bio,
        verificationStatus: user.verificationStatus,
        relevance,
        data: user
      });
    });

    // Companies
    companies.forEach(company => {
      let relevance = 0;
      if (company.name.toLowerCase() === searchQuery.toLowerCase()) relevance += 100;
      if (company.name.toLowerCase().startsWith(searchQuery.toLowerCase())) relevance += 50;
      if (company.name.toLowerCase().includes(searchQuery.toLowerCase())) relevance += 30;
      if (company.industry?.toLowerCase().includes(searchQuery.toLowerCase())) relevance += 40;
      if (company.description?.toLowerCase().includes(searchQuery.toLowerCase())) relevance += 20;
      
      results.push({
        type: 'company',
        id: company._id,
        name: company.name,
        avatar: company.logoUrl,
        subtitle: company.industry,
        description: company.description,
        relevance,
        data: company
      });
    });

    // Organizations
    organizations.forEach(org => {
      let relevance = 0;
      if (org.name.toLowerCase() === searchQuery.toLowerCase()) relevance += 100;
      if (org.name.toLowerCase().startsWith(searchQuery.toLowerCase())) relevance += 50;
      if (org.name.toLowerCase().includes(searchQuery.toLowerCase())) relevance += 30;
      if (org.organizationType?.toLowerCase().includes(searchQuery.toLowerCase())) relevance += 40;
      if (org.description?.toLowerCase().includes(searchQuery.toLowerCase())) relevance += 20;
      
      results.push({
        type: 'organization',
        id: org._id,
        name: org.name,
        avatar: org.logoUrl,
        subtitle: org.organizationType,
        description: org.description,
        relevance,
        data: org
      });
    });

    // Posts
    posts.forEach(post => {
      let relevance = 0;
      if (post.title?.toLowerCase().includes(searchQuery.toLowerCase())) relevance += 40;
      if (post.content.toLowerCase().includes(searchQuery.toLowerCase())) relevance += 30;
      if (post.hashtags?.includes(searchQuery.toLowerCase())) relevance += 50;
      
      results.push({
        type: 'post',
        id: post._id,
        name: post.title || post.content.substring(0, 100),
        avatar: post.author?.avatar,
        subtitle: `Post by ${post.author?.name || 'Unknown'}`,
        description: post.content.substring(0, 150),
        relevance,
        data: post
      });
    });

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    // Apply pagination
    const paginatedResults = results.slice(skip, skip + limitNum);

    // Group by type for response metadata
    const typeCounts = {};
    results.forEach(result => {
      typeCounts[result.type] = (typeCounts[result.type] || 0) + 1;
    });

    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: results.length,
        pages: Math.ceil(results.length / limitNum)
      },
      metadata: {
        typeCounts,
        query: searchQuery
      }
    });
  } catch (error) {
    console.error('Global search error:', error);
    next(createError(500, 'Error performing global search'));
  }
};