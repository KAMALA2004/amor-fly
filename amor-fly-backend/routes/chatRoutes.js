// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { testChat } = require('../controllers/chatController');

router.get('/test', testChat);

module.exports = router;
