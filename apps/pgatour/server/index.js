var express     = require('express');
var cors        = require('cors');
var compress    = require('compression');
var path        = require('path');
var config      = require('./config');
var router      = require('./router');
var players     = require('./players');
var db          = require('./db');

//--------------------------------------------------------------------------
//
//  App
//
//--------------------------------------------------------------------------

var app = express();
app.use(cors());
app.use(compress());

//--------------------------------------
//  Routing
//--------------------------------------

app.use('/', router);
app.use('/players', players);

//--------------------------------------
//  Configuration
//--------------------------------------

app.use(express.static(path.join(__dirname, '..', 'app')));

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, '..', 'views'));

//--------------------------------------
//  Run
//--------------------------------------

app.listen(app.get('port'), function() {
    console.log('Listening on port ' + app.get('port'));
});