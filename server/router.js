var fs = require('fs');
var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    fs.createReadStream(__dirname + '/../app/index.html').pipe(res);
});

module.exports = router;