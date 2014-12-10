/** @jsx React.DOM */

var Dispatcher      = require('./app/Dispatcher');
var ActionCreator   = require('./app/ActionCreator');
var MainView        = require('./view/MainView.jsx');

module.exports = function (config) {
    var view = <MainView dispatcher={ Dispatcher } />;

    ActionCreator.loadStats();

    return view;
};
