const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.registerForm = (req, res) => {
  res.render('register');
};

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name');
  req.checkBody('name', 'Parce, hay que poner un nombre').notEmpty();
  req.checkBody('email', 'Ese no es un email de verdad').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false,
  });
  req.checkBody('password', 'No puede haber clave en blanco').notEmpty();
  req
    .checkBody(
      'password-confirm',
      'No puede haber confirmacion de clave en blanco'
    )
    .notEmpty();
  req
    .checkBody('password-confirm', 'Esas contraseñas son diferentes')
    .equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash(
      'error',
      errors.map((err) => err.msg)
    );
    // pasamos el body pa rellenar el formulario y los flashes por que como los llamamos aqui mismo, toca
    // enviarlos de forma manual
    res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash(),
    });
    return;
  }
  next();
};

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  // Promisify nos devuelve una promesa, de una funcion, en este caso de 2do atributo le pasamos
  // el objeto que contiene el metodo, ya que user.register no es una funcion, si no un metodo
  const registerWithPromise = promisify(User.register, User);
  // ya que tenemos promisified el register ( metodo de la libreria pasport ) podemos usarlo con sus atributos normales
  await registerWithPromise(user, req.body.password);
  next();
};

exports.account = (req, res) => {
  res.render('account', { title: 'Edit Your Account' });
};

exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email,
  };

  // query - update - options, asi funciona el findOneAndUpdate ( funcion de mongo )
  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: updates },
    { new: true, runValidators: true, context: 'query' }
  );
  req.flash('success', 'Perfil Actualizado!');
  res.redirect('back');
};
