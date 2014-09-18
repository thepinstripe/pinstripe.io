var minimist = require('minimist');

var argv = minimist(process.argv.slice(2));
var command = argv._[0];

process.on('uncaughtException', function(err) {
    console.error('Uncaught exception: ' + err.stack);
});

require('./lib/' + command)(argv);
