var _       = require('lodash');
var async   = require('async');
var util    = require('../../../lib/util/index');
var urls    = require('./../urls');

var stats   = require('./stats');
var results = require('./results');
var career  = require('./career');
var news    = require('./news');
var photo   = require('./photo');

var PLAYERS_DIR = './data/players';

module.exports = function(config, done) {

    var playerId = config.id;
    
    console.log('Loading player with ID: ' + playerId + '...');
    
    util.get(urls.player(playerId), function ($) {
        var data = {
            bio: parseBio($('.player-bio')),
            links: parseLinks($('.module-player-navigation .nav-tabs').first())
        };
        
        util.io.saveJSON(PLAYERS_DIR + '/' + playerId + '/bio.json', data);
        
        var subConfig = {
            id: playerId,
            output: PLAYERS_DIR
        };
        
        async.series([stats, results, career, news, photo].map(function(fn) {
            return function (done) {
                fn(subConfig, done);
            };
        }), done);
    });

};

function parseBio($) {
    var $bioData = $.find('.player-bio-data').first();
    var bio = {
        name: $.find('.title').text(),
        photo: $.find('img').first().attr('src'),
        country: $.find('.icon').text()
    };
    
    var attrs = util.selection.map($bioData.find('p'), function($el) {
        return [
            $el.find('span').text(),
            $el.text().split('\n').shift()
        ];
    });
    
    attrs.forEach(function(attrPair) {
        bio[attrPair[0]] = attrPair[1];
    });
    
    return bio;
}

function parseLinks($) {
    var pairs = util.selection.map($.find('li a'), function($el) {
        return [
            $el.text().toLowerCase(),
            urls.absolute($el.attr('href'))
        ]
    });
    
    return pairs.reduce(function(links, pair) {
        links[pair[0]] = pair[1];
        return links;
    }, {});
}
