const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
// Guardamos el usuario para poder ser utilizado en autenticacion de passport
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
