const express = require("express");
const router = express.Router();

const { githubRedirect, githubCallback, getMe, logout } = require("../controllers/authController");

const authenticateUser = require("../middleware/auth");

router.get("/github", githubRedirect);

router.get("/github/callback", githubCallback);

router.get("/me", authenticateUser, getMe);

router.post("/logout", logout);

module.exports = router;
