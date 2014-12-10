/** @jsx React.DOM */

var config = require('../../config');

module.exports = React.createClass({
    
    displayName: 'Header',

    getDefaultProps: function () {
        return {
            scrollY: 0,
            documentHeight: 0
        };
    },

    getInitialState: function () {
        return {
            colourScale: d3.scale.linear().range(config.palette.scale)
        };
    },

    updateColourScale: function () {
        var scale   = this.state.colourScale;
        var s       = [];
        var len     = scale.range().length;
        var h       = this.props.documentHeight;
        var inc     = h / len;

        for (var i = 0; i < len; i++) {
            s.push(i * inc);
        }

        scale.domain(s);
    },

    render: function () {
        this.updateColourScale();

        var accent = this.state.colourScale(this.props.scrollY);

        return (
            <header className="header">
                <div id="header-logo" className="header__logo" style={{ 'border-color': accent }}>
                    { this.renderLogo(accent) }
                </div>
            </header>
        );
    },

    renderLogo: function (accent) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="34" height="290">
                <rect x="0" y="247.2" style={{ fill: accent }} width="33.2" height="1.6"/>
                <path style={{ fill: accent }} d="M.9 241.8c-.6 0-1-.4-1-1 0-.3.1-.6.4-.8l30.7-31h-30.8v-1.6h32.2c.6 0 1 .4 1 1 0 .3-.1.6-.4.8l-30.7 31h31.1v1.6h-32.5z"/>
                <rect x="0" y="79.2" fill="#3CB7BA" width="33.2" height="1.6"/>
                <path fill="#EDEBF1" d="M19.2 74.7v-23.4c0-1.8-.2-3.5-.5-5-.4-1.5-.9-2.7-1.6-3.8-.7-1-1.6-1.9-2.6-2.4s-2.3-.9-3.8-.9c-1.4 0-2.7.3-3.8.9-1.1.6-2 1.4-2.8 2.4-.7 1.1-1.3 2.3-1.7 3.8-.4 1.5-.6 3.1-.6 4.9v23.4h-1.6v-23.3c0-2 .2-3.8.6-5.4.4-1.7 1.1-3.1 2-4.3.9-1.2 2-2.2 3.3-2.9 1.3-.7 2.8-1 4.6-1 1.7 0 3.2.3 4.5 1 1.3.7 2.3 1.6 3.2 2.9.8 1.2 1.4 2.7 1.8 4.3.4 1.6.6 3.5.6 5.4v21.8h12.7v1.6h-14.3z"/>
                <rect x="31.7" style={{ fill: accent }} width="1.6" height="34.4"/>
                <rect x="0" fill="#EDEBF1" width="1.6" height="34.4"/>
                <rect x="15.5" fill="#EDEBF1" width="1.6" height="34.4"/>
                <path style={{ fill: accent }} d="M19.2 290.3v-23.4c0-1.8-.2-3.5-.5-5-.4-1.5-.9-2.7-1.6-3.8-.7-1-1.6-1.9-2.6-2.4-1.1-.6-2.3-.9-3.8-.9-1.4 0-2.7.3-3.8.9-1.1.6-2 1.4-2.8 2.4-.7 1.1-1.3 2.3-1.7 3.8-.4 1.5-.6 3.1-.6 4.9v23.4h-1.6v-23.4c0-2 .2-3.8.6-5.4.4-1.7 1.1-3.1 2-4.3.9-1.2 2-2.2 3.3-2.9 1.3-.7 2.8-1 4.6-1 1.7 0 3.2.3 4.5 1 1.3.7 2.3 1.6 3.2 2.9.8 1.2 1.4 2.7 1.8 4.3.4 1.6.6 3.5.6 5.4v21.8h12.7v1.6h-14.3z"/>
                <path fill="#7EC9D3" d="M31.9 203.1v-25.1c0-3.7-.6-6.5-1.8-8.2-1.1-1.7-3-2.5-5.6-2.5-2.6 0-4.3.8-5.3 2.5-1.1 1.8-1.6 4.5-1.6 8.2v12.8c0 4-.6 7.1-1.9 9.1-1.3 2.1-3.5 3.2-6.6 3.2-3.1 0-5.4-1.1-6.8-3.1-1.4-2-2.1-5.1-2.1-9.2v-89.3c0-2 .2-3.8.6-5.4.4-1.7 1.1-3.1 2-4.3.9-1.2 2-2.2 3.3-2.9 1.3-.7 2.8-1 4.6-1 1.7 0 3.2.3 4.5 1 1.3.7 2.3 1.6 3.2 2.9.8 1.2 1.4 2.7 1.8 4.3.3 1.2.4 2.5.5 3.8l12.8-15.9v2.6l-12.7 15.8v20.9h12.7v1.6h-14.3v-23.4c0-1.8-.2-3.5-.5-5-.4-1.5-.9-2.7-1.6-3.8-.7-1-1.6-1.9-2.6-2.4-1.1-.6-2.3-.9-3.8-.9-1.4 0-2.7.3-3.8.9-1.1.6-2 1.4-2.8 2.4-.7 1.1-1.3 2.3-1.7 3.8-.4 1.5-.6 3.1-.6 4.9v43.7h31.7v1.6h-31.7v44c0 3.7.6 6.5 1.8 8.2 1.1 1.7 3 2.5 5.6 2.5 2.6 0 4.3-.8 5.3-2.5 1-1.8 1.6-4.5 1.6-8.2v-12.7c0-4 .6-7.1 1.9-9.1 1.3-2.1 3.5-3.2 6.6-3.2 3.1 0 5.4 1.1 6.8 3.1 1.4 2 2.1 5.1 2.1 9.2v25.2h-1.6z"/>
            </svg>
        );
    }
    
});