const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { catchErrors } = require('../handlers/errorHandlers');

//el segundo parametro es el middleware, el cual podra modificar todo antes de llegar al controller normal
// router.get('/', storeController.myMiddleware, storeController.homePage);

//Envolvemos nuestra funciones en una funcion que revisa por errores, es como envolver todo
//en un try catch, esto es composition ( util para el async await)
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', authController.isLoggedIn, storeController.addStore);

router.post(
  '/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);
router.post(
  '/add/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);
router.post(
  '/register',
  userController.validateRegister,
  userController.register,
  authController.login
);

router.get('/logout', authController.logout);
router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post(
  '/account/reset/:token',
  authController.confirmPasswords,
  catchErrors(authController.update)
);
router.get('/map', storeController.mapPage);
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));
router.get(
  '/hearts',
  authController.isLoggedIn,
  catchErrors(storeController.getHearts)
);
/* 
  API
*/

router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post;
/* 
  END API
*/

/* ESTOS SON TEST NO SON PARTE DE LA APP */
router.get('/test', (req, res) => {
  // Solo podemos enviar 1 solicitud por router
  //res.send('Hey! It works!');
  console.log(`los query son ${req.query}`);
  if (req.query.name !== undefined) {
    res.json(req.query.name);
  } else {
    const jose = {
      name: 'jose',
      age: 175,
      cool: true,
      instructions: 'Envia parametros por query pa verlos con key name',
    };
    res.json(jose);
  }
});

router.get('/reverse/:name', (req, res) => {
  const reverseName = [...req.params.name].reverse().join('');
  res.send(reverse);
});

router.get('/render', (req, res) => {
  res.render('hello', {
    name: `jose`,
    dog: req.query.dog,
    title: `tests variable`,
  });
});
/* HASTA ACA LLEGAN LOS TESTS */

module.exports = router;
// AIzaSyD9ycobB5RiavbXpJBo0Muz2komaqqvGv0
