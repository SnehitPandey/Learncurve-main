import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import User from '../models/user.model';

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
                proxy: true,
            },
            async (_accessToken, _refreshToken, profile: Profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        return done(new Error('No email found in Google profile'));
                    }

                    // Try to find by googleId first
                    let user = await User.findOne({ googleId: profile.id });

                    if (!user) {
                        // Fall back to email — account may already exist
                        user = await User.findOne({ email });

                        if (user) {
                            // Link Google ID to existing account
                            user.googleId = profile.id;
                            user.avatar = profile.photos?.[0]?.value || user.avatar;
                            await user.save();
                        } else {
                            // Create new user
                            user = await User.create({
                                googleId: profile.id,
                                name: profile.displayName,
                                email,
                                avatar: profile.photos?.[0]?.value,
                            });
                        }
                    } else {
                        // Update avatar on every login
                        user.avatar = profile.photos?.[0]?.value || user.avatar;
                        await user.save();
                    }

                    return done(null, {
                        _id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar,
                    });
                } catch (err) {
                    return done(err as Error);
                }
            }
        )
    );
} else {
    console.warn('[Passport] Google OAuth credentials not set — Google auth disabled');
}

export default passport;
