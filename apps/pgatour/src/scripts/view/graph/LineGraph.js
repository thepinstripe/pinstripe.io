/*global d3,_ */

module.exports = function(config) {

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //--------------------------------------
    //  Config
    //--------------------------------------

    var width       = config.width;
    var height      = config.height;
    var tipLabel    = config.tipLabel;

    //--------------------------------------
    //  Axes
    //--------------------------------------

    var xAxis = d3.svg.axis()
        .orient('bottom')
        .innerTickSize(0)
        .outerTickSize(0);

    //--------------------------------------------------------------------------
    //
    //  Rendering
    //
    //--------------------------------------------------------------------------
    
    function render(options) {
        options = _.extend({}, config, options);

        //--------------------------------------
        //  Config
        //--------------------------------------

        var id          = options.id;
        var margin      = options.margin || 10;

        //--------------------------------------
        //  Scales
        //--------------------------------------

        var xScaleMin = d3.min(data, function(d) { return d.tournament.date });
        var xScaleMax = d3.max(data, function(d) { return d.tournament.date });
        var yScaleMin = d3.min(data, _.property(''));
        var yScaleMax = d3.max(data, stats.y);

        var xScale = d3.time.scale()
            .range([margin, width - margin])
            .domain([xScaleMin, xScaleMax]);

        var yScale = scale(options.yScale)
            .range([margin, height - margin])
            .domain([yScaleMin, yScaleMax]);
        
        //--------------------------------------
        //  Line
        //--------------------------------------
        
        var line = d3.svg.line()
            .x(x)
            .y(y);
        
        
    }
    
    return {
        render: render
    };

};
