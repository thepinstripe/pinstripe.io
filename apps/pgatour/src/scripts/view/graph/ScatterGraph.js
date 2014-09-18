/*global d3,_ */

var DataAspect  = require('./aspect/DataAspect');
var Crosshair   = require('./element/Crosshair');
var MidAxis     = require('./element/MidAxis');

var TRANSITION = 'exp';
var TRANSITION_IN = TRANSITION + '-in';
var TRANSITION_OUT = TRANSITION + '-out';
var TRANSITION_IN_OUT = TRANSITION + '-in-out';

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
    
    //--------------------------------------
    //  Elements
    //--------------------------------------
    
    var $el = d3.select(config.el)
        .append('svg')
        .attr({
            width: width,
            height: height
        });
    
    //--------------------------------------
    //  Crosshair
    //--------------------------------------
    
    var elementOpts = _.extend(config, {
        el: $el.node()
    });
    
    var midAxis = MidAxis(elementOpts);
    var crosshair = Crosshair(elementOpts);
    
    //--------------------------------------
    //  Tip
    //--------------------------------------

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .html(tipLabel);

    $el.call(tip);
    
    //--------------------------------------------------------------------------
    //
    //  Rendering
    //
    //--------------------------------------------------------------------------
    
    function render(data, options) {
        options = _.extend({}, config, options);
        options.dataAspects = _.extend({}, config.dataAspects, options.dataAspects);

        //--------------------------------------
        //  Config
        //--------------------------------------

        var id          = options.id;
        var dataAspects = DataAspect.validate(options.dataAspects);
        var margin      = options.margin || 10;
        var sort        = options.sort;
        
        //--------------------------------------
        //  Data
        //--------------------------------------
        
        _.each(data, function(d) {
            d.attributes = {};
        });
        
        //--------------------------------------
        //  Scales
        //--------------------------------------
        
        _.chain(dataAspects).keys().each(function(key) {
            dataAspects[key].update(data);
        });

        var xScale = dataAspects.x.scale()
            .range([margin, width - margin]);

        var yScale = dataAspects.y.scale()
            .range([margin, height - margin]);
        
        xAxis.scale(xScale);
        
        //--------------------------------------
        //  Setup data
        //--------------------------------------

        data = _
            .chain(data)
            .each(function(item) {
                _.extend(item, DataAspect.getAspectValues(dataAspects, item));
            })
            .sortBy(dataAspects[sort] || function() { return 0 })
            .value();
        
        tip.direction(function(item) {
            var y = item.y;

            return y < 100 ? 's' : 'n';
        });
        
        //--------------------------------------
        //  Enter
        //--------------------------------------
        
        var $ = {};
        
        $.data = $el
            .selectAll('.dot')
            .data(data, id);

        $.enter = $.data.enter().call(enter);

        //--------------------------------------
        //  Exit
        //--------------------------------------
        
        $.exit = $.data.exit().call(exit);
        
        //--------------------------------------
        //  Update
        //--------------------------------------
        
        $el.call(merge);
        
        midAxis.render(xAxis);
        
        //--------------------------------------
        //  Enter
        //--------------------------------------

        function enter() {
            var $ = this.append('g')
                .classed('dot', true)
                .classed('ryder-eu', function(d) {
                    return d.ryderCup === 'eu';
                })
                .classed('ryder-us', function(d) {
                    return d.ryderCup === 'us';
                });

            $.call(createHalo);
            $.call(createDot);

            $.selectAll('circle')
                .attr({
                    cx: _.property('x'),
                    cy: yScale(0)
                })
                .style({
                    opacity: 0
                });
        }

        function createHalo() {
            return this.append('circle')
                .classed('dot__halo', true)
                .attr({
                    r: 2
                })
                .on('mouseover', onMouseOver)
                .on('mouseout', onMouseOut);
        }

        function createDot() {
            return this.append('circle')
                .classed('dot__circle', true)
                .attr({
                    r: 8
                })
                .style({
                    opacity: 0
                });
        }
        
        //--------------------------------------
        //  Merge
        //--------------------------------------
        
        function merge() {
            this.selectAll('.dot__halo').call(mergeHalo);
            this.selectAll('.dot__circle').call(mergeDot);
        }
        
        function mergeHalo() {
            this.transition()
                .ease(TRANSITION_OUT)
                .duration(600)
                .delay(function(d, i) {
                    return d.x * 2.5 + 200;
                })
                .attr({
                    cx: _.property('x'),
                    cy: _.property('y'),
                    r: _.property('r')
                })
                .style({
                    opacity: _.property('a')
                });
        }
        
        function mergeDot() {
            this.transition()
                .ease(TRANSITION_IN_OUT)
                .duration(400)
                .delay(function(d, i) {
                    return d.x * 2.5;
                })
                .attr({
                    cx: _.property('x'),
                    cy: _.property('y'),
                    r: 2
                })
                .style({
                    opacity: 1
                });
        }
        
        //--------------------------------------
        //  Exit
        //--------------------------------------
        
        function exit() {
            this.transition()
                .duration(300)
                .style({
                    opacity: 0
                })
                .remove();
        }
    }
    
    //--------------------------------------------------------------------------
    //
    //  Event handlers
    //
    //--------------------------------------------------------------------------

    function onMouseOver(player) {
        tip.show(player);
        crosshair.show(player.x, player.y);
    }

    function onMouseOut() {
        tip.hide();
        crosshair.hide();
    }
    
    return {
        render: render
    };
    
};
