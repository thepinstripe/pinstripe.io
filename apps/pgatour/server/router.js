var express = require('express');
var players = require('./players');
var router  = express.Router();

router.use('/players', players);

module.exports = router;