import express from 'express';
import bodyParser from 'body-parser';
import sqlRoutes from './routes/sqlRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';
import { pool,getUserById } from './utils/db.js';
import session from 'express-session';
import passport from 'passport';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
    origin: 'http://127.0.0.1:8080',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
}

app.use(cors(corsOptions));
// app.use(cors({ origin: 'http://127.0.0.1:8080', credentials: true }));

app.set('dbPool', pool);

app.use(session({ 
    secret: 'secretKey@ipplMakeDB', 
    resave: false, 
    saveUninitialized: false,
    cookie: {
        secure: false,
        sameSite: 'Lax'
        // httpOnly: true
    }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRoutes);
app.use('/sql', sqlRoutes);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    getUserById(id, (err, user) => {
        if (err) return done(err);
        if (!user) return done(null, false);
        return done(null, user);
    });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}).on('error', console.error.bind(console));
