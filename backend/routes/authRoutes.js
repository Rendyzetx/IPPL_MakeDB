import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool, registerUser, logActivity } from '../utils/db.js';

const router = express.Router();

passport.use(new GoogleStrategy({
    clientID: "xx",
    clientSecret: "xx",
    callbackURL: "http://localhost:3000/auth/google/callback"
},
async (token, tokenSecret, profile, done) => {
    try {
        console.log('Profile received from Google:', profile);
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

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), async (req, res) => {
    console.log('req sesion', req.session);
    if(!req.user){
        console.error('Tidak ada');
        // return res.redirect('/');
    }
    const { id, displayName, emails } = req.user;
    const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    req.session.userId = id;
    req.session.displayName = displayName;
    req.session.email = emails[0].value
    try {
        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if(err) {
                    console.error('gagal save session:', err);
                    reject(err);
                } else {
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

router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('http://127.0.0.1:8080/index.html');
    });
});


export default router;
