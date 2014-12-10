var express     = require('express');
var cors        = require('cors');
var compress    = require('compression');
var path        = require('path');
var router      = require('./server/router');

//--------------------------------------------------------------------------
//
//  App
//
//--------------------------------------------------------------------------

var app = express();
app.use(cors());
app.use(compress());
app.use(express.static(path.join(__dirname, 'app')));

//--------------------------------------
//  Routing
//--------------------------------------

app.use('/', router);
app.use('/apps/pgatour', require('./apps/pgatour')(app).router);

//--------------------------------------
//  Configuration
//--------------------------------------

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, '..', 'views'));

//--------------------------------------
//  Run
//--------------------------------------

app.listen(app.get('port'), function() {
    console.log('Listening on port ' + app.get('port'));
});