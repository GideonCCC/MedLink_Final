import passport from 'passport';

// Passport JWT authentication middleware
const requireAuth = passport.authenticate('jwt', { session: false });

// Role-based authorization middleware
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

export { requireAuth, requireRole };
