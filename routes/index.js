const authRoutes = require('./authRoutes')
const projectRoutes = require('./projectsRoutes')
const express = require('express')
const router = express.Router()

router.use('/auth', authRoutes)
router.use('/projects', projectRoutes)

module.exports = router
