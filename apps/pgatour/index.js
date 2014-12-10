var express     = require('express');
var path        = require('path');
var config      = require('./server/config');
var router      = require('./server/router');
var db          = require('./server/db');

module.exports = function (app) {

    //--------------------------------------
    //  Configuration
    //--------------------------------------

    app.use('/apps/pgatour', express.static(path.join(__dirname, 'app')));

    return {
        router: router
    };
};
