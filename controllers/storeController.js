const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer'); // subir fotos
const jimp = require('jimp'); // resize de fotos
const uuid = require('uuid'); // nombres unicos
const User = mongoose.model('User');
// hay que especificar donde poner la foto y que tipo de fotos podemos guardar
const multerOptions = {
  // decimos que queremos guardarla en memoria ( temporal ), no en el disco del pc
  storage: multer.memoryStorage(),
  // miramos que tipo de imagen queremos, en este caso, solo fotos que tengan el prefijo image/
  fileFilter: function (req, file, next) {
    // el mimetype describe el tipo de la foto, esto no es modificable por otras personas, es de la foto
    const isPhoto = file.mimetype.startsWith('image/'); // image/png, image/jpg --> image/ es pa todas
    if (isPhoto) {
      // pasar next con el 1er parametro == null significa error,
      // pasarlo con el 1er parametro !== null significa que vamos pa lante
      next(null, true);
    } else {
      next({ message: "That filetype isn't allowed!" }, false);
    }
  },
};

exports.myMiddleware = (req, res, next) => {
  req.name = 'Wees';

  //el next, es pa decir que ya acabamos con este middleware y podemos seguir al proximo
  next();
};

exports.homePage = (req, res) => {
  console.log(req.name);
  res.render('index');
};

//- el res.render nos renderiza una view, y podemos pasar parametros con los corchetes
exports.addStore = (req, res) => {
  res.render('editStore', { title: '💩 Add Store' });
};

// solo una foto con single
exports.upload = multer(multerOptions).single('photo');

// el next es necesario, ya que aca no haremos render de nada, esto es un middleware, y necesitamos el next
// para poder continuar al proximo metodo
exports.resize = async (req, res, next) => {
  // miramos si no hay files para el resize
  if (!req.file) {
    next(); // saltamos al proximo middelware, metodo
    return;
  }
  //tomamos la extension de image/png
  const extension = req.file.mimetype.split('/')[1];
  //metemos la foto en el body, con un nombre random de uuid
  req.body.photo = `${uuid.v4()}.${extension}`;
  // le enviamos el buffer de la foto, que es nuestra foto guardada en memoria
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  // guardamos la foto, para utilizarla despues
  await photo.write(`./pulic/uploads/${req.body.photo}`);
  console.log(`foto subida, buscar ${req.body.photo}`);
  next();
};

exports.createStore = async (req, res) => {
  //conectamos el autor con el id del user
  req.body.author = req.user._id;
  //guardamos datos localmente en el store
  const store = new Store(req.body);
  // Guaramos el store en mongo
  const storeData = await store.save();
  //el Flash es un alert que nos muestra info la proxima vez que carguemos una pagina
  req.flash(
    'success',
    `Creacion completa ${store.name}. Dejarias un comentario?`
  );
  res.redirect(`/store/${storeData.slug}`);
};

exports.getStores = async (req, res) => {
  //asi podemos traer datos del db
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('Debes ser el propietario de una store pa editarla');
  }
};

exports.editStore = async (req, res) => {
  // 1. find the store given the ID
  const store = await Store.findOne({ _id: req.params.id });
  //2. confirm they are the owner of the store
  confirmOwner(store, req.user);
  //3. render out the edit form so the user can update ther store
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  //ponemos la locacion como un point de nuevo
  if (req.body.location !== undefined) {
    req.body.location.type = 'Point';
  }
  //actualizamos en la db
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // retornar el valor nuevo, no el viejo
    runValidators: true, // obliga a nuestro modelo a tomar los validators que declaramos al comienzo
  }).exec(); // ejecutamos el query

  //mosrtamos la alerta en la proxima pantalla
  req.flash(
    'success',
    `Se actualizo correctamente <stong>${store.name}</>.
  <a href="/stores/${store.slug}" Ver en la tienda -> </a>`
  );
  //redirijimos a la proxima pantalla
  res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
  //res.json(req.params) FUNCION UTIL PA VER DATOS EN LA PANTALLA
  const store = await Store.findOne({ slug: req.params.slug }).populate(
    'author'
  ); // el populate, toma el ObjectId en author y busca y pega en author los datos que vienen cone se ID
  if (!store) {
    // podemos usar next para actuar como un middleWare, y solo seguir a la proxima pantalla, ( errores/404/etc.. )
    return next();
  } else {
    res.render('store', { store, title: store.name });
  }
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  // o tenemos un valor, o tomamos todos los items que tengan este atributo
  const tagQuery = tag || { $exists: true };
  // 2 awaits distintos, pero los necesitamos lanzar al mismo tiempo pa no esperar uno y desp el otro
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  // Esperamos 2 promesas, que van a salir al mismo tiempo
  // Destructuramos el arreglo que nos retorna el promise.all
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tag', { tags, title: 'Tags', tag, stores });
};

exports.searchStores = async (req, res) => {
  console.log(req.query.q);
  const stores = await Store.find(
    {
      // $text busca en los index que son de tipo texto
      $text: {
        // buscamos con el valor q del query
        $search: req.query.q,
      },
    },
    {
      // proyectamos ( insertamos ) un nuevo valor
      score: { $meta: 'textScore' }, // $meta entra con la metadata de mongo, textScore predefinido, da mas score al valor que mas repita
    }
  )
    // Organizamos de mayor a menor dado el valor del $meta-textScore
    .sort({
      score: { $meta: 'textScore' },
    });
  res.send(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const query = {
    // filtramps por lacacion, los cercanos a nuestras coordinanas, con distanciaMax de 10kms
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates,
        },
        $maxDistance: 10000, //10.000 meters - 10km
      },
    },
  };

  //tomamos los del query y solo seleccionamos los datos que necesitamos de cada store en el select
  const stores = await Store.find(query)
    .select('slug name description location photo')
    .limit(10);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.heartStore = async (req, res) => {
  // revisamos los favoritos que tiene el user y los convertimos a string ya que estan como un object
  const hearts = req.user.hearts.map((obj) => obj.toString());
  // miramos si ya esta el store en fav pa ver si lo traemos con pull o lo enviamos con add
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User.findByIdAndUpdate(
    req.user._id,
    // [variable] forma de poner variables
    { [operator]: { hearts: req.params.id } },
    // mongo, devuelveme el valor como quedo desp del cambio, no antes. eso significa el new: true
    { new: true }
  );
  res.json(user);
};

exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts },
  });
  res.render('stores', { title: 'Hearted Stores', stores });
};
