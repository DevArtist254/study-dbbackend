const express = require('express');
const {signup,protect, login, restrictTo, forgotPassword, resetPassword} = require('./../controllers/authController');

const Router = express();

Router.post('/signup', signup);
Router.post('/login', login);
Router.post('/forgotPassword', forgotPassword);
Router.post('/resetPassword/:token',  resetPassword);

module.exports = Router;