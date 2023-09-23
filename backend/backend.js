import express from 'express';
import bodyParser from 'body-parser';
import sqlRoutes from './routes/sqlRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';
import { pool } from './utils/db.js';
import session from 'express-session';
import passport from 'passport';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('dbPool', pool);

app.use('/', sqlRoutes);
app.use('/auth', authRoutes);

app.use(session({ secret: 'xx', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((id, done) => {
    done(null, id);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
