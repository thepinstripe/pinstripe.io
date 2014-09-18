var _       = require('lodash');
var express = require('express');
var player  = require('./player');
var io      = require('../util/io');
var players = require('./index');

var respond = io.wrapResponse;
var router = express.Router();

//--------------------------------------------------------------------------
//
//  Collections
//
//--------------------------------------------------------------------------

function getPlayers(req, res) {
    player.getPlayers(['id', 'bio'], respond(res));
}

//--------------------------------------------------------------------------
//
//  Single player
//
//--------------------------------------------------------------------------

function getPlayer(req, res) {
    var id = req.param('id');
    
    player.getPlayerById(id, respond(res));
}

function getPlayerStats(req, res) {
    var id = req.param('id');
    
    player.getPlayerById(id, ['stats'], respond(res));
}

function getPlayerTournamentStats(req, res) {
    var id = req.param('id');

    player.getPlayerTournamentStatsById(id, respond(res));
}

function getPlayerNews(req, res) {
    var id = req.param('id');

    player.getPlayerNewsById(id, respond(res));
}

function getStatForAllPlayers(req, res) {
    var ids = req.param('ids').split(',');
    
    player.getStatsForAllPlayers(ids, respond(res));
}

//--------------------------------------------------------------------------
//
//  Routing
//
//--------------------------------------------------------------------------

router.get('/', getPlayers);
router.get('/:id', getPlayer);
router.get('/:id/stats', getPlayerStats);
router.get('/:id/news', getPlayerNews);
router.get('/:id/tournaments/stats', getPlayerTournamentStats);
router.get('/stats/:ids', getStatForAllPlayers);

module.exports = router;
