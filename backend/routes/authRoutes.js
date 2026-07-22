const express = require('express');
const router = express.Router();
const registerUser = require('../controllers/authController');
const loginUser = require('../controllers/authController');
const logoutUser = require('../controllers/authController');

route.post('/register',registerUser);
route.post('/login',loginUser);
route.post('/logout',logoutUser);

module.exports = router;