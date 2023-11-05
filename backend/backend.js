import express from 'express';
import bodyParser from 'body-parser';
import sqlRoutes from './routes/sqlRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';
import { pool,getUserById } from './utils/db.js';
import session from 'express-session';
import MySQLStore from 'express-mysql-session';
import passport from 'passport';
import dotenv from 'dotenv';
import fs from 'fs';
import https from 'https';
dotenv.config();
const privateKey = fs.readFileSync('/etc/letsencrypt/live/server.makedb.online/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/server.makedb.online/fullchain.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/server.makedb.online/chain.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

const MySQLStoreWithSession = MySQLStore(session);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const options = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE
};

const SessionStore = new MySQLStoreWithSession(options);
const corsOptions = {
    origin: 'https://makedb.online',
    credentials: true,
};

app.use(cors(corsOptions));

app.set('dbPool', pool);

app.use(session({
  secret: process.env.SECRET,
  store: SessionStore,
  resave: false,
  proxy: true,
  saveUninitialized: false,
  cookie: {
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 5,
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'lax'
  }
}));

app.use(express.static('public', {
    etag: false,
    cacheControl: true,
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}));

app.use((req, res, next) => {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    next();
});

app.get('/', (req, res) => {
    res.send('Make-DB Server !');
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

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(3000, () => {
    console.log('HTTPS Server running on port 3000');
  }).on('error', console.error.bind(console));
