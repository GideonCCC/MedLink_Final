import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../database/connection.js';

// Initialize JWT strategy - this will be called after dotenv.config()
function initializePassport() {
  // Ensure JWT_SECRET is available
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  };

  passport.use(
    new JwtStrategy(opts, async (payload, done) => {
      try {
        const db = getDatabase();
        let userObjectId;
        
        try {
          userObjectId = new ObjectId(payload.userId);
        } catch (error) {
          return done(null, false);
        }

        const user = await db
          .collection('users')
          .findOne({ _id: userObjectId }, { projection: { hashedPassword: 0 } });

        if (user) {
          return done(null, {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
          });
        }

        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    })
  );
}

// Initialize immediately if JWT_SECRET is already set (for cases where dotenv loaded first)
if (process.env.JWT_SECRET) {
  initializePassport();
} else {
  // Otherwise, export a function to initialize later
  passport.initializeStrategy = initializePassport;
}

export default passport;

