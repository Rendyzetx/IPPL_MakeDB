import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { registerUser, logActivity } from '../utils/db.js';

const router = express.Router();

passport.use(new GoogleStrategy({
    clientID: "571679498319-g6e9t3fapk5uisc3q91l5lfgn2l808fu.apps.googleusercontent.com",
    clientSecret: "xx",
    callbackURL: "http://localhost:3000/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    const userId = await registerUser(email);
    done(null, userId);
}));

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), async (req, res) => {
    await logActivity(req.user, 'User Logged In');
    res.redirect('/somewhere_in_your_app');
});

export default router;
