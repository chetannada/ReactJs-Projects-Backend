const { baseRoot } = require("../controllers/authController");
const authRoutes = require("./authRoutes");
const projectRoutes = require("./projectsRoutes");
const express = require("express");
const router = express.Router();

router.get("/", baseRoot);
router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);

module.exports = router;
