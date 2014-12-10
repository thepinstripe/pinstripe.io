var ApplicationView = require('./view/ApplicationView.jsx');

var AppRegistry = require('./app/AppRegistry');
AppRegistry.register('pgatour', require('../../apps/pgatour/src/scripts'));

var appView = React.renderComponent(ApplicationView(), document.getElementById('global'));