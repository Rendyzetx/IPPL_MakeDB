import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool, registerUser, logActivity } from '../utils/db.js';

const router = express.Router();

passport.use(new GoogleStrategy({
    clientID: "571679498319-g6e9t3fapk5uisc3q91l5lfgn2l808fu.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:3000/auth/google/callback"
},
async (token, tokenSecret, profile, done) => {
    try {
        // console.log('Profile received from Google:', profile);
        let [rows] = await pool.query('SELECT * FROM users WHERE google_id = ?', [profile.id]);
        if (rows.length === 0) {
            console.log('User Tidak Ditemukan, Tambahkan Ke db');
            const [result] = await pool.query('INSERT INTO users (google_id, name, email) VALUES (?, ?, ?)', 
                                             [profile.id, profile.displayName, profile.emails[0].value]);
            profile.dbId = result.insertId;
        } else {
            console.log('User Ditemukan', rows[0]);
            profile.dbId = rows[0].id;
        }
        return done(null, profile);
    } catch (error) {
        console.error('Error:', error);
        return done(error);
    }
}));

router.get('/google', (req, res, next) => {
    console.log('tes1:', req.session)
    console.log('tes2:', req.user)
    if (req.session && req.session.user) {
        res.redirect('http://127.0.0.1:8080/index2.html');
    } else {
        next();
    }
}, passport.authenticate('google', { scope: ['profile', 'email'] }));


router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), async (req, res) => {
    console.log('Session (Callback):', req.session);
    console.log('User:', req.user);
    if(!req.user){
        console.error('User not found');
        return res.redirect('/');
    }

    const { id, displayName, emails } = req.user;
    const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    req.session.user = {
        userId: id,
        displayName: displayName,
        email: emails[0].value
    };

    try {
        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if(err) {
                    console.error('Failed to save session:', err);
                    reject(err);
                } else {
                    console.log('Session saved successfully');
                    resolve();
                }
            });
        });
        const userId = await registerUser(id, displayName, emails[0].value, userIp);
        await logActivity(userId, emails[0].value, userIp, 'User Logged In');
    } catch (error) {
        console.error('Error:', error);
    }
    res.redirect('http://127.0.0.1:8080/index2.html');
});

router.get('/check-login-status', (req, res) => {
    console.log('Checking login status...');
    console.log('Session:', req.session);
    console.log('User ID:', req.session.userId);
    if (req.isAuthenticated()) {
        res.json({ isLoggedIn: true });
    } else {
        res.json({ isLoggedIn: false });
    }
});
router.get('/check-session', (req, res) => {
    console.log('Session (check-session):', req.session);
    console.log('User(check-session):', req.user);
    if(req.session && req.session.userId) {
        res.send('Session exists, user ID: ' + req.session.userId);
    } else {
        res.send('No session found!');
    }
});

router.get('/logout', (req, res) => {
    console.log('logouttttttt:', req.user)
    if (req.isAuthenticated()) {
        console.log('User is authenticated, trying to log out...');
        try {
            req.logout();
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                } else {
                    console.log('Session destroyed, clearing cookie...');
                    res.clearCookie('connect.sid');
                    console.log('Redirecting to home...');
                    res.redirect('/');
                }
            });
        } catch (err) {
            console.error('Error during logout:', err);
        }
    } else {
        console.log('User is not authenticated, redirecting...');
        res.redirect('http://127.0.0.1:8080/index.html');
    }
});


export default router;
