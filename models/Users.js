const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// hay que poner eso por un bug de mongo, normalmente seria solo en app.js
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid Email Address Puto'],
    required: 'Nea, obvio pone el email',
  },
  name: {
    type: String,
    required: 'Hay que poner el nombre, gva!',
    trim: true,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  hearts: [
    // objectId es una referencia de id a otro item en la DB
    { type: mongoose.Schema.ObjectId, ref: 'Store' },
  ],
});

// Los atributos virtuales no se guardan en la db, solamente se calculan on the fly.
// creamos una function en vez de un arrow, para poder usar this, en contexto con el user.
userSchema.virtual('gravatar').get(function () {
  const hash = md5(this.email);
  // esta es una web que genera avatars dado un hash de un email
  return `https://gravatar.com/avatar/${hash}?s=200`;
});
// ponemos una libreria a registrar al usuario manejando todos los protocolos de seguridad en claves
// haciendo el hash de la clave y guardandolo en la db
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
// ponemos errores bonitos
userSchema.plugin(mongodbErrorHandler);

// usamos module.exports por que esta es la unica cosa que exportamos del file, nada mas
module.exports = mongoose.model('User', userSchema);
