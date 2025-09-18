// Restrict access to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

// Check if user is the owner of the resource or has admin role
exports.isOwnerOrAdmin = (resourceOwnerIdPath = 'params.id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Get resource owner ID from the specified path
    const pathParts = resourceOwnerIdPath.split('.');
    let resourceOwnerId = req;
    for (const key of pathParts) {
      resourceOwnerId = resourceOwnerId && resourceOwnerId[key];
    }

    // Check if user is the owner of the resource
    if (req.user.userId !== resourceOwnerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};