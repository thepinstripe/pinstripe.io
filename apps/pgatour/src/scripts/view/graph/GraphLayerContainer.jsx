/** @jsx React.DOM */

module.exports = React.createClass({

    props: {
        dataAspects: React.dataTypes.arrayOf(React.dataTypes.object),
        dataPoints: React.dataTypes.arrayOf(React.dataTypes.object),
        id: React.dataTypes.func
    },

    getDefaultProps: function () {
        return {
            id: _.property('id'),
            dataAspects: [],
            dataPoints: []
        };
    },

    willReceiveProps: function () {
        // Update dataPoints via dataAspects.
    },

    render: function () {
        return (
            <g>
                { _.map(this.props.children, this.transferPropsTo, this) }
            </g>
        );
    }

});