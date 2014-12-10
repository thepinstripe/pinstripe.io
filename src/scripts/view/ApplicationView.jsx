/** @jsx React.DOM */

var Header          = require('./component/Header.jsx');
var ScrollHandler   = require('./helper/ScrollHandler');
var AppRegistry     = require('../app/AppRegistry');

module.exports = React.createClass({

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    displayName: 'ApplicationView',

    mixins: [],

    statics: {},

    propTypes: {},

    //--------------------------------------------------------------------------
    //
    //  Defaults
    //
    //--------------------------------------------------------------------------

    getDefaultProps: function () {
        return {};
    },

    getInitialState: function () {
        return {
            currentApp: 'pgatour'
        }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    //--------------------------------------
    //  Mounting
    //--------------------------------------

    componentWillMount: function () {
        this.scrollHandler = ScrollHandler({
            onScroll: this.onScroll,
            onResize: this.onResize
        });
        this.scrollHandler.init();
    },

    componentDidMount: function () {
        this.componentDidUpdate();
    },

    componentWillUnmount: function () {
    },

    //--------------------------------------
    //  Props
    //--------------------------------------

    componentWillReceiveProps: function (props) {
    },

    //--------------------------------------
    //  Update
    //--------------------------------------

    componentWillUpdate: function () {
    },

    componentDidUpdate: function () {
        var appName = this.state.currentApp;

        if (!this.app || this.appName !== appName) {
            this.loadApp(appName);
        }
    },

    //--------------------------------------------------------------------------
    //
    //  Rendering
    //
    //--------------------------------------------------------------------------

    render: function () {
        return (
            <div>
                <Header scrollY={ this.state.scrollY } documentHeight={ document.body.offsetHeight } />
                <div ref="appContainer" className="appcontainer">
                    { this.app }
                </div>
            </div>
        );
    },

    loadApp: function (name) {
        var currentAppName = this.state.currentApp;

        if (name !== currentAppName) {
            return this.setState({
                currentApp: name
            });
        }

        var app = AppRegistry.get(currentAppName);
        this.app = app();
        this.appName = name;

        this.forceUpdate();
    },

    //--------------------------------------------------------------------------
    //
    //  Event handling
    //
    //--------------------------------------------------------------------------

    onScroll: function (scrollY) {
        this.setState({ scrollY: scrollY });
    },

    onResize: function (width, height) {
        this.setState({ width: width, height: height });
    }

});