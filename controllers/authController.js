const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const promisify = require('es6-promisify');
const User = mongoose.model('User');
const mail = require('../handlers/mail');
// Usamos passport para autenticar el usuario, y le damos las opciones de que hacer cuando autentique
exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Fallo el login',
  successRedirect: '/',
  successFlash: 'Acabase de inciar sesion mi fai',
});
// esto es manejado por passport.js
exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'Log Out completo');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  // Otra funcion de passport
  if (req.isAuthenticated()) {
    next();
    return;
  }
  req.flash(
    'error',
    'Ooops, Debes de inicizr sesion pa estar aqui, solo VIP putos'
  );
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'No account with that email exist.');
    return res.redirect('/login');
  }
  // modulo build in de nodeJs, nos da un valor crypto aleatorio
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
  await user.save();

  const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  req.flash(
    'success',
    `Te hemos enviado un email con un link pa resetear la clave. ${resetUrl}`
  );
  await mail.send({
    user,
    subject: 'Password Reset',
    resetUrl,
    filename: 'password-reset', // el hrml que enviaremos
  });
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token, // Que tenga el mismo token
    resetPasswordExpires: { $gt: Date.now() }, // Buscamos que el valor sea Greater Than (GT)
  });
  if (!user) {
    req.flash('error', 'Password reset token es invalido o ya expiro');
    return res.redirect('/login');
  }

  res.render('reset', { title: 'Reset Your Password' });
};

exports.confirmPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next();
    return;
  }
  req.flash('error', 'Password no concuerdan parce, todo bien en casa?');
  res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token, // Que tenga el mismo token
    resetPasswordExpires: { $gt: Date.now() }, // Buscamos que el valor sea Greater Than (GT)
  });

  if (!user) {
    req.flash('error', 'Password reset token es invalido o ya expiro');
    return res.redirect('/login');
  }

  //Util de passport - enviamos la funcion y el objeto con el que hara BIND
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  // el save() es necesario pa guardar todo en la db
  const updatedUser = await user.save();
  // passport.js para login, super util
  await req.login(updatedUser);
  req.flash('success', '👯‍♀️ Genial, clave reseteada, y ya te loggeamos');
  res.redirect('/');
};
