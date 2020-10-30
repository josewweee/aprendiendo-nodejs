const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  // Solo podemos enviar 1 solicitud por router
  //res.send('Hey! It works!');
  console.log(`los query son ${req.query}`);
  if (req.query.name !== undefined) {
    res.json(req.query.name);
  } else {
    const jose = { name: 'jose', age: 175, cool: true, instructions: 'Envia parametros por query pa verlos con key name' };
    res.json(jose);
  }
});

router.get('/reverse/:name', (req, res) => {
  const reverseName = [...req.params.name].reverse().join('');
  res.send(reverse);
});

router.get('/render', (req, res) => {
  res.render('hello');
});

module.exports = router;
