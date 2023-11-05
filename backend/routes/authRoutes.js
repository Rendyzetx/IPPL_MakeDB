import express from "express";
import passport from "passport";
import cors from "cors";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { pool, registerUser, logActivity,revokeToken } from "../utils/db.js";
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const app = express();
passport.use(
  new GoogleStrategy(
    {
      clientID:
      process.env.AUTH_ID,
      clientSecret: process.env.AUTH_SECRET,
      callbackURL: process.env.AUTH_CALLBACK,
      passReqToCallback: true
    },
    async (req,accessToken, refreshToken, profile, done) => {
      try {
        let [rows] = await pool.query(
          "SELECT * FROM users WHERE google_id = ?",
          [profile.id]
        );
        if (rows.length === 0) {
          console.log("User Tidak Ditemukan, Tambahkan Ke db");
          const [result] = await pool.query(
            "INSERT INTO users (google_id, name, email) VALUES (?, ?, ?)",
            [profile.id, profile.displayName, profile.emails[0].value]
          );
          profile.dbId = result.insertId;
        } else {
          console.log("User Ditemukan", rows[0]);
          profile.dbId = rows[0].id;
        }
        req.session.accessToken = accessToken;
        return done(null, profile);
      } catch (error) {
        console.error("Error:", error);
        return done(error);
      }
    }
  )
);

router.get(
  "/google",
  (req, res, next) => {
    console.log("tes1:", req.session);
    console.log("tes2:", req.user);
    if (req.session && req.user) {
      res.redirect("/auth/home");
    } else {
      next();
    }
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    console.log("Session (Callback):", req.session);
    console.log("User:", req.user.displayName);
    if (!req.user) {
      console.error("User not found");
      return res.redirect("/");
    }

    const { id, displayName, emails } = req.user;
    const userIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    req.session.user = {
      userId: id,
      displayName: displayName,
      email: emails[0].value,
    };

    try {
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Failed to save session:", err);
            reject(err);
          } else {
            console.log("Session saved successfully");
            resolve();
          }
        });
      });
      const userId = await registerUser(
        id,
        displayName,
        emails[0].value,
        userIp
      );
      await logActivity(userId, emails[0].value, userIp, "User Logged In");
    } catch (error) {
      console.error("Error:", error);
    }

    res.redirect("/auth/home");
  }
);

router.get("/home", (req, res) => {
  if (req.isAuthenticated) {
    console.log("===ada : ", req.user);
    console.log("===data : ", req.session.user.displayName);
    res.redirect("https://makedb.online/index2.html");
  } else {
    console.log("gada");
    res.redirect("https://makedb.online/index.html");
  }
});

router.get("/login", (req, res) => {
  res.redirect("https://makedb.online/index.html");
});
router.get("/logout", (req, res) => {
  console.log("berhasil");
  console.log(req.session.user);
  console.log(req.isAuthenticated());
  const token = req.session.accessToken;
  if (req.isAuthenticated()) {
    console.log("User is authenticated, trying to log out...");

    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      } else {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.clearCookie("connect.sid");
        revokeToken(token);
        res.json({
          data: true,
        });
      }
    });
  } else {
    console.log("User is not authenticated, redirecting to login page...");
    res.json({
      data: false,
    });
  }
});

router.get("/check-login-status", (req, res) => {
  console.log("Checking login status...");
  console.log("Session:", req.session);
  console.log("User ID:", req.session.userId);
  if (req.isAuthenticated()) {
    res.json({ isLoggedIn: true });
  } else {
    res.json({ isLoggedIn: false });
  }
});

router.get("/check-session", (req, res) => {
  console.log("Session (check-session):", req.session);
  console.log("User(check-session):", req.user);
  if (req.session && req.session.userId) {
    res.send("Session exists, user ID: " + req.session.userId);
  } else {
    res.send("No session found!");
  }
});

export default router;
