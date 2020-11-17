const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

//Podemos crear el modelo de datos que mongo usara con mongoose.Schema
const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    // poner un texto significa required: true, solo que con el texto, daremos info adicional
    required: 'Porfavor pon un nombre de tienda',
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: [
      {
        type: Number,
        required: 'Debes ingresar un texto',
      },
    ],
    address: {
      type: String,
    },
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'Debes de dar un author',
  },
});

//Definimos el index, para optimizar queries
storeSchema.index({
  name: 'text',
  description: 'text',
});

storeSchema.index({ location: '2dsphere' });

//Podemos hacer una especie de middleware antes de guardar en la DB para asignar variables
storeSchema.pre('save', async function (next) {
  if (!this.isModified('name')) {
    next(); //skit it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  // para nombres repetidos, pondremos slug-1, slug-2, slug-3 etc...
  const slugRegEx = new RegExp(`ˆ(${this.slug})((-[0-9]*$)?)$`, 'i');
  // buscamos en el store, pero como puede que aun no se haya creado, entonces usamos this.constructor.find
  // en vez de store.find
  const storeWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storeWithSlug) {
    this.slug = `${this.slug}-${storeWithSlug.length + 1}`;
  }
  next();
});
// usamos function y no arrow function, para poder usar this (que en este caso es el store)
// statics es como prototype
storeSchema.statics.getTagsList = function () {
  // creamos un query de pipelines en mongo, eso toca estudiarlo, tiene cosas muy locas
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

//- exportamos el modelo
module.exports = mongoose.model('Store', storeSchema);
