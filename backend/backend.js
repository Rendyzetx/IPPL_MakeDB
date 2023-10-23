import express from 'express';
import bodyParser from 'body-parser';
import sqlRoutes from './routes/sqlRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';
import { pool,getUserById } from './utils/db.js';
import session from 'express-session';
import passport from 'passport';
import Sequelize from 'sequelize';
import SequelizeStore from 'connect-session-sequelize';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sequelize = new Sequelize('make_db_akun', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
  });

const SessionStore = SequelizeStore(session.Store);

const corsOptions = {
    origin: 'http://127.0.0.1:8080',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204
}

app.use(cors(corsOptions));
// app.use(cors());

app.set('dbPool', pool);

app.use(session({
    secret: '',
    store: new SessionStore({
      db: sequelize,
    }),
    resave: false,
    proxy: true,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production',
        secure: false,
        maxAge: 1000 * 60 * 5,
        sameSite: 'lax'
    }
}));

app.use((req, res, next) => {
    if (req.session.user) {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
    }
    next();
});

app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRoutes);
app.use('/sql', sqlRoutes);

passport.serializeUser((user, done) => {
    console.log(`Serializing user: ${JSON.stringify(user)}`);
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        console.log(`userID: ${id}`);
        const user = await getUserById(id);
        if (!user) {
            return done(null, false);
        }
        console.log(`User deserialized: ${JSON.stringify(user)}`);
        return done(null, user);
    } catch (error) {
        return done(error);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}).on('error', console.error.bind(console));
