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
  } /* , 
    toJSON: { virtuals: true},
    toObject: { virtual: true} */, // Para ver los virtuals en json
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
// statics es como prototype, para hacer agregations, ( querys complejos de varias lineas )
storeSchema.statics.getTagsList = function () {
  // creamos un query de pipelines en mongo, eso toca estudiarlo, tiene cosas muy locas
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

storeSchema.statics.getTopStoresSchema = function () {
  return this.aggregate([
    // Miramos stores y populamos sus reviews
    {
      // casi como un virtual, creamos una nueva propiedad
      $lookup: {
        from: 'reviews', // desde el modelo Review -> mongo le pone una s y todo en minus
        localField: '_id', // la propiedad que hara match con
        foreignField: 'store', // esta propiedad del modelo remoto
        as: 'reviews', // crearemos una nueva propiedad con este nombre
      },
    },
    // filtamos solo las que tengan 2 o mas reviews
    // ese reviews.1 es como reviews[1]
    { $match: { 'reviews.1': { $exists: true } } },
    // agregamos una propiedad (project) con el promedio de reviews
    {
      $project: {
        photo: '$$ROOT.photo',
        name: '$$ROOT.name',
        reviews: '$$ROOT.reviews',
        slug: '$$ROOT.slug',
        averageRating: { $avg: '$reviews.rating' },
      },
    },
    // sort basado en ratings de mayor a menor
    { $sort: { averageRating: -1 } },
    // limit to at most 10
    { $limit: 10 },
  ]);
};

// Traemos todos los items de reviews que hagan match del localField y el foreignField,
// virtual para que no guardmeos ninguna relacion, es virtual, solo pal momento, y no salen
// si nos los llamamos directamente store.reviews, ni salen en agregations
storeSchema.virtual('reviews', {
  ref: 'Review', // shcema remoto
  localField: '_id', // match de la propiedad _id en este schema
  foreignField: 'store', // match de la pripiedad store en el schema de Review
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

//- exportamos el modelo
module.exports = mongoose.model('Store', storeSchema);
