(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
    ryderCup: {
        us: 'Rickie Fowler,Jim Furyk,Zach Johnson,Matt Kuchar,Phil Mickelson,Patrick Reed,Jordan Spieth,Jimmy Walker,Bubba Watson,Keegan Bradley,Hunter Mahan,Webb Simpson'.split(','),
        eu: 'Thomas Bjorn,Jamie Donaldson,Victor Dubuisson,Sergio Garcia,Martin Kaymer,Graeme McDowell,Rory McIlroy,Justin Rose,Henrik Stenson,Stephen Gallacher,Ian Poulter,Lee Westwood'.split(',')
    }
};
},{}],2:[function(require,module,exports){
/*global d3,_*/

var DrivingStatsView = require('./view/DrivingStatsView');

DrivingStatsView({
    el: document.querySelector('.graph')
});
},{"./view/DrivingStatsView":4}],3:[function(require,module,exports){
var accessors = (function() {
    var drivingDistance = statAccessor('Driving Distance');
    var drivingAccuracy = statAccessor('Driving Accuracy Percentage');
    var leftTendency    = statAccessor('Left Tendency');
    var clubHeadSpeed   = statAccessor('Club Head Speed');

    return {
        drivingDistance: drivingDistance,
        drivingAccuracy: drivingAccuracy,
        clubHeadSpeed: clubHeadSpeed,
        leftTendency: leftTendency,
        tendency: function(player) {
            var lt = leftTendency(player);
            var rt = 100 - lt;
            var value = rt - 50;

            if (lt > rt) {
                value = -(lt - 50);
            }

            return value;
        }
    };
})();

function statAccessor(statName) {
    return function(player) {
        if (!_.isUndefined(player.attributes[statName])) {
            return player.attributes[statName];
        }

        var stat = _.find(player.stats, function(stat) {
            return stat.name === statName;
        });

        return stat ?
            (player.attributes[statName] = _.parseInt(stat.value)) :
            undefined;
    };
}

accessors.accessor = statAccessor;

module.exports = accessors;

},{}],4:[function(require,module,exports){
/*global d3,_*/

var config              = require('../config');
var ScatterGraph        = require('./graph/ScatterGraph');
var DataAspect          = require('./graph/aspect/DataAspect');
var PlayerStatAccessor  = require('../model/PlayerStatAccessor');

var stats = '101,102,02422,02423,02401'.split(',');
var ryderCup = config.ryderCup;

function DrivingStatsView (options) {
    
    var players;
    
    var configs = {
        tendency: {
            // Just defaults
        },
        accuracy: {
            dataAspects: {
                a: {
                    value: function (player) {
                        return 0.5;
                    },
                    scale: d3.scale.linear().range([0.1, 0.5])
                },
                y: {
                    value: function (player) {
                        var value = (100 - PlayerStatAccessor.drivingAccuracy(player)) / 2;
                        var leftTendency = PlayerStatAccessor.leftTendency(player);
                        var isLeft = leftTendency > 50;

                        return isLeft ? -value : value;
                    },
                    scale: d3.scale.pow().exponent(1.5)
                }
            }
        }
    };

    var view = ScatterGraph({
        el: options.el,
        id: _.property('id'),
        width: 1024,
        height: 700,
        sort: 'r',
        dataAspects: {
            x: PlayerStatAccessor.drivingDistance,
            y: {
                value: PlayerStatAccessor.tendency,
                align: DataAspect.CENTRE
            },
            r: {
                value: PlayerStatAccessor.drivingAccuracy,
                scale: d3.scale.linear().range([12, 4])
            },
            a: {
                value: PlayerStatAccessor.clubHeadSpeed,
                scale: d3.scale.linear().range([0.1, 0.5])
            }
        },
        tipLabel: function (player) {
            var drivingDistance = PlayerStatAccessor.drivingDistance(player);
            var clubHeadSpeed = PlayerStatAccessor.clubHeadSpeed(player);
            var drivingAccuracy = PlayerStatAccessor.drivingAccuracy(player);
            var leftTendency = PlayerStatAccessor.leftTendency(player);
            var tendency;

            if (leftTendency < 50) tendency = 'right';
            if (leftTendency > 50) tendency = 'left';

            // 208 * 276
            return (
                '<div style="width: 230px">' +
                    '<img src="' + player.bio.photo + '" style="float: left; width: 50px; height: 66px; margin-right: 10px; border-radius: 2px">' +
                    '<strong class="peppermint">' + player.bio.name + '</strong><br>' +
                    drivingDistance + ' yards' +
                    (tendency ? ', ' + (tendency === 'left' ? leftTendency : (100 - leftTendency)) + '% ' + tendency + ' tendency' : '') +
                    '<br>' +
                    'Driving accuracy: ' + drivingAccuracy + '%<br>' +
                    'Club head speed: ' + clubHeadSpeed +
                '</div>'
            );
        }
    });

    var $buttons = d3.selectAll('#actions button');

    function render(config) {
        view.render(players, configs[config]);

        $buttons.classed('is-selected', function () {
            return d3.select(this).attr('data-config') === config;
        });
    }

    $buttons.on('click', function () {
        var config = d3.select(this).attr('data-config');

        console.log('Switch config', config);

        render(config);
    });

    d3.json('/players/stats/' + stats.join(','), function (data) {
        players = _
            .chain(data)
            .filter(function (player) {
                return player.stats.length === stats.length;
            })
            .each(function (player) {
                _.each(_.keys(ryderCup), function (key) {
                    if (ryderCup[key].indexOf(player.bio.name) >= 0) {
                        player.ryderCup = key;
                    }
                });
            })
            .value();
        
        render('tendency');
    });
    
    return {
        render: render
    };
}

module.exports = DrivingStatsView;

},{"../config":1,"../model/PlayerStatAccessor":3,"./graph/ScatterGraph":5,"./graph/aspect/DataAspect":6}],5:[function(require,module,exports){
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

},{"./aspect/DataAspect":6,"./element/Crosshair":7,"./element/MidAxis":8}],6:[function(require,module,exports){
/*global d3,_*/

function DataAspect (config) {
    if (_.isFunction(config)) {
        config = { value: config };
    }

    var value = config.value;
    var scale = config.scale || d3.scale.linear();
    var min = config.min || d3.min;
    var max = config.max || d3.max;

    function getScale () {
        return scale;
    }

    function getValue (d) {
        return value(d);
    }
    
    function getScaledValue (d) {
        return scale(value(d));
    }

    function update (data, options) {
        config = _.extend(config, options);

        var scaleMin;
        var scaleMax = max(data, getValue);
        
        // TODO: Better way to do this with scales?
        if (!min && config.align === DataAspect.CENTRE) {
            scaleMin = -scaleMax;
        } else {
            scaleMin = min(data, getValue);
        }
        
        scale.domain([scaleMin, scaleMax]);
    }

    return _.extend(getValue, {
        scale: getScale,
        scaledValue: getScaledValue,
        update: update
    });
}

DataAspect.CENTRE = 'centre';

DataAspect.validate = function (dataAspects) {
    if (dataAspects) {
        _.chain(dataAspects)
            .keys()
            .each(function(key) {
                if (!(dataAspects[key] instanceof DataAspect)) {
                    dataAspects[key] = DataAspect(dataAspects[key]);
                }
            });
    }
    
    return dataAspects;
};

DataAspect.getAspectValues = function (dataAspects, item) {
    return _.reduce(_.keys(dataAspects), function(values, key) {
        var aspect = dataAspects[key];
        values[key] = aspect.scaledValue(item);
        return values;
    }, {});
};

module.exports = DataAspect;
},{}],7:[function(require,module,exports){
/*global d3*/

function Crosshair(config) {
    var $el = d3.select(config.el).append('g')
        .classed('crosshair', true)
        .style('opacity', 0);
    
    var width = config.width;
    var height = config.height;

    var $crosshairLineX = $el.append('line')
        .attr({
            x1: 0,
            x2: 0,
            y1: -height,
            y2: height
        });

    var $crosshairLineY = $el.append('line')
        .attr({
            x1: -width,
            x2: width,
            y1: 0,
            y2: 0
        });
    
    function show(x, y) {
        $el
            .attr('transform', 'translate(' + x + ',' + y + ')')
            .style('opacity', 1);
    }
    
    function hide() {
        $el.style('opacity', 0);
    }
    
    return {
        show: show,
        hide: hide
    };
}

module.exports = Crosshair;
},{}],8:[function(require,module,exports){
/*global d3 */

function MidAxis(config) {
    var $el = d3.select(config.el);
    var width = config.width;
    var height = config.height;
    
    var $midLine = $el.append('line')
        .classed('hairline', true)
        .attr({
            x1: 0,
            x2: width,
            y1: height / 2,
            y2: height / 2
        });

    var $axis = $el.append('g')
        .classed('axis', true)
        .classed('axis--x', true);

    function render(axis) {
        $axis
            .attr('transform', 'translate(0,' + Math.round(height / 2) + ')')
            .call(axis);

        $axis
            .selectAll('.tick line')
            .attr('y1', -height * 0.5)
            .attr('y2', height * 0.5);

        $axis
            .selectAll('text')
            .attr('transform', 'rotate(-90) translate(' + ((height * 0.5) - 10) + ', -40)')
            .style('font-size', '30px')
            .style('text-anchor', 'end');
        
        return $axis;
    }
    
    return {
        render: render
    };
}

module.exports = MidAxis;
},{}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9yaWNoL0RldmVsb3BtZW50L3BpbnN0cmlwZS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3JpY2gvRGV2ZWxvcG1lbnQvcGluc3RyaXBlL2FwcHMvcGdhdG91ci9zcmMvc2NyaXB0cy9jb25maWcvaW5kZXguanMiLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvYXBwcy9wZ2F0b3VyL3NyYy9zY3JpcHRzL2luZGV4LmpzIiwiL1VzZXJzL3JpY2gvRGV2ZWxvcG1lbnQvcGluc3RyaXBlL2FwcHMvcGdhdG91ci9zcmMvc2NyaXB0cy9tb2RlbC9QbGF5ZXJTdGF0QWNjZXNzb3IuanMiLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvYXBwcy9wZ2F0b3VyL3NyYy9zY3JpcHRzL3ZpZXcvRHJpdmluZ1N0YXRzVmlldy5qcyIsIi9Vc2Vycy9yaWNoL0RldmVsb3BtZW50L3BpbnN0cmlwZS9hcHBzL3BnYXRvdXIvc3JjL3NjcmlwdHMvdmlldy9ncmFwaC9TY2F0dGVyR3JhcGguanMiLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvYXBwcy9wZ2F0b3VyL3NyYy9zY3JpcHRzL3ZpZXcvZ3JhcGgvYXNwZWN0L0RhdGFBc3BlY3QuanMiLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvYXBwcy9wZ2F0b3VyL3NyYy9zY3JpcHRzL3ZpZXcvZ3JhcGgvZWxlbWVudC9Dcm9zc2hhaXIuanMiLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvYXBwcy9wZ2F0b3VyL3NyYy9zY3JpcHRzL3ZpZXcvZ3JhcGgvZWxlbWVudC9NaWRBeGlzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICByeWRlckN1cDoge1xuICAgICAgICB1czogJ1JpY2tpZSBGb3dsZXIsSmltIEZ1cnlrLFphY2ggSm9obnNvbixNYXR0IEt1Y2hhcixQaGlsIE1pY2tlbHNvbixQYXRyaWNrIFJlZWQsSm9yZGFuIFNwaWV0aCxKaW1teSBXYWxrZXIsQnViYmEgV2F0c29uLEtlZWdhbiBCcmFkbGV5LEh1bnRlciBNYWhhbixXZWJiIFNpbXBzb24nLnNwbGl0KCcsJyksXG4gICAgICAgIGV1OiAnVGhvbWFzIEJqb3JuLEphbWllIERvbmFsZHNvbixWaWN0b3IgRHVidWlzc29uLFNlcmdpbyBHYXJjaWEsTWFydGluIEtheW1lcixHcmFlbWUgTWNEb3dlbGwsUm9yeSBNY0lscm95LEp1c3RpbiBSb3NlLEhlbnJpayBTdGVuc29uLFN0ZXBoZW4gR2FsbGFjaGVyLElhbiBQb3VsdGVyLExlZSBXZXN0d29vZCcuc3BsaXQoJywnKVxuICAgIH1cbn07IiwiLypnbG9iYWwgZDMsXyovXG5cbnZhciBEcml2aW5nU3RhdHNWaWV3ID0gcmVxdWlyZSgnLi92aWV3L0RyaXZpbmdTdGF0c1ZpZXcnKTtcblxuRHJpdmluZ1N0YXRzVmlldyh7XG4gICAgZWw6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5ncmFwaCcpXG59KTsiLCJ2YXIgYWNjZXNzb3JzID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBkcml2aW5nRGlzdGFuY2UgPSBzdGF0QWNjZXNzb3IoJ0RyaXZpbmcgRGlzdGFuY2UnKTtcbiAgICB2YXIgZHJpdmluZ0FjY3VyYWN5ID0gc3RhdEFjY2Vzc29yKCdEcml2aW5nIEFjY3VyYWN5IFBlcmNlbnRhZ2UnKTtcbiAgICB2YXIgbGVmdFRlbmRlbmN5ICAgID0gc3RhdEFjY2Vzc29yKCdMZWZ0IFRlbmRlbmN5Jyk7XG4gICAgdmFyIGNsdWJIZWFkU3BlZWQgICA9IHN0YXRBY2Nlc3NvcignQ2x1YiBIZWFkIFNwZWVkJyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBkcml2aW5nRGlzdGFuY2U6IGRyaXZpbmdEaXN0YW5jZSxcbiAgICAgICAgZHJpdmluZ0FjY3VyYWN5OiBkcml2aW5nQWNjdXJhY3ksXG4gICAgICAgIGNsdWJIZWFkU3BlZWQ6IGNsdWJIZWFkU3BlZWQsXG4gICAgICAgIGxlZnRUZW5kZW5jeTogbGVmdFRlbmRlbmN5LFxuICAgICAgICB0ZW5kZW5jeTogZnVuY3Rpb24ocGxheWVyKSB7XG4gICAgICAgICAgICB2YXIgbHQgPSBsZWZ0VGVuZGVuY3kocGxheWVyKTtcbiAgICAgICAgICAgIHZhciBydCA9IDEwMCAtIGx0O1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gcnQgLSA1MDtcblxuICAgICAgICAgICAgaWYgKGx0ID4gcnQpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IC0obHQgLSA1MCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH07XG59KSgpO1xuXG5mdW5jdGlvbiBzdGF0QWNjZXNzb3Ioc3RhdE5hbWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocGxheWVyKSB7XG4gICAgICAgIGlmICghXy5pc1VuZGVmaW5lZChwbGF5ZXIuYXR0cmlidXRlc1tzdGF0TmFtZV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gcGxheWVyLmF0dHJpYnV0ZXNbc3RhdE5hbWVdO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN0YXQgPSBfLmZpbmQocGxheWVyLnN0YXRzLCBmdW5jdGlvbihzdGF0KSB7XG4gICAgICAgICAgICByZXR1cm4gc3RhdC5uYW1lID09PSBzdGF0TmFtZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHN0YXQgP1xuICAgICAgICAgICAgKHBsYXllci5hdHRyaWJ1dGVzW3N0YXROYW1lXSA9IF8ucGFyc2VJbnQoc3RhdC52YWx1ZSkpIDpcbiAgICAgICAgICAgIHVuZGVmaW5lZDtcbiAgICB9O1xufVxuXG5hY2Nlc3NvcnMuYWNjZXNzb3IgPSBzdGF0QWNjZXNzb3I7XG5cbm1vZHVsZS5leHBvcnRzID0gYWNjZXNzb3JzO1xuIiwiLypnbG9iYWwgZDMsXyovXG5cbnZhciBjb25maWcgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vY29uZmlnJyk7XG52YXIgU2NhdHRlckdyYXBoICAgICAgICA9IHJlcXVpcmUoJy4vZ3JhcGgvU2NhdHRlckdyYXBoJyk7XG52YXIgRGF0YUFzcGVjdCAgICAgICAgICA9IHJlcXVpcmUoJy4vZ3JhcGgvYXNwZWN0L0RhdGFBc3BlY3QnKTtcbnZhciBQbGF5ZXJTdGF0QWNjZXNzb3IgID0gcmVxdWlyZSgnLi4vbW9kZWwvUGxheWVyU3RhdEFjY2Vzc29yJyk7XG5cbnZhciBzdGF0cyA9ICcxMDEsMTAyLDAyNDIyLDAyNDIzLDAyNDAxJy5zcGxpdCgnLCcpO1xudmFyIHJ5ZGVyQ3VwID0gY29uZmlnLnJ5ZGVyQ3VwO1xuXG5mdW5jdGlvbiBEcml2aW5nU3RhdHNWaWV3IChvcHRpb25zKSB7XG4gICAgXG4gICAgdmFyIHBsYXllcnM7XG4gICAgXG4gICAgdmFyIGNvbmZpZ3MgPSB7XG4gICAgICAgIHRlbmRlbmN5OiB7XG4gICAgICAgICAgICAvLyBKdXN0IGRlZmF1bHRzXG4gICAgICAgIH0sXG4gICAgICAgIGFjY3VyYWN5OiB7XG4gICAgICAgICAgICBkYXRhQXNwZWN0czoge1xuICAgICAgICAgICAgICAgIGE6IHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIChwbGF5ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwLjU7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHNjYWxlOiBkMy5zY2FsZS5saW5lYXIoKS5yYW5nZShbMC4xLCAwLjVdKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgeToge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZnVuY3Rpb24gKHBsYXllcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gKDEwMCAtIFBsYXllclN0YXRBY2Nlc3Nvci5kcml2aW5nQWNjdXJhY3kocGxheWVyKSkgLyAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxlZnRUZW5kZW5jeSA9IFBsYXllclN0YXRBY2Nlc3Nvci5sZWZ0VGVuZGVuY3kocGxheWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc0xlZnQgPSBsZWZ0VGVuZGVuY3kgPiA1MDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlzTGVmdCA/IC12YWx1ZSA6IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBzY2FsZTogZDMuc2NhbGUucG93KCkuZXhwb25lbnQoMS41KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdmlldyA9IFNjYXR0ZXJHcmFwaCh7XG4gICAgICAgIGVsOiBvcHRpb25zLmVsLFxuICAgICAgICBpZDogXy5wcm9wZXJ0eSgnaWQnKSxcbiAgICAgICAgd2lkdGg6IDEwMjQsXG4gICAgICAgIGhlaWdodDogNzAwLFxuICAgICAgICBzb3J0OiAncicsXG4gICAgICAgIGRhdGFBc3BlY3RzOiB7XG4gICAgICAgICAgICB4OiBQbGF5ZXJTdGF0QWNjZXNzb3IuZHJpdmluZ0Rpc3RhbmNlLFxuICAgICAgICAgICAgeToge1xuICAgICAgICAgICAgICAgIHZhbHVlOiBQbGF5ZXJTdGF0QWNjZXNzb3IudGVuZGVuY3ksXG4gICAgICAgICAgICAgICAgYWxpZ246IERhdGFBc3BlY3QuQ0VOVFJFXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcjoge1xuICAgICAgICAgICAgICAgIHZhbHVlOiBQbGF5ZXJTdGF0QWNjZXNzb3IuZHJpdmluZ0FjY3VyYWN5LFxuICAgICAgICAgICAgICAgIHNjYWxlOiBkMy5zY2FsZS5saW5lYXIoKS5yYW5nZShbMTIsIDRdKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGE6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogUGxheWVyU3RhdEFjY2Vzc29yLmNsdWJIZWFkU3BlZWQsXG4gICAgICAgICAgICAgICAgc2NhbGU6IGQzLnNjYWxlLmxpbmVhcigpLnJhbmdlKFswLjEsIDAuNV0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRpcExhYmVsOiBmdW5jdGlvbiAocGxheWVyKSB7XG4gICAgICAgICAgICB2YXIgZHJpdmluZ0Rpc3RhbmNlID0gUGxheWVyU3RhdEFjY2Vzc29yLmRyaXZpbmdEaXN0YW5jZShwbGF5ZXIpO1xuICAgICAgICAgICAgdmFyIGNsdWJIZWFkU3BlZWQgPSBQbGF5ZXJTdGF0QWNjZXNzb3IuY2x1YkhlYWRTcGVlZChwbGF5ZXIpO1xuICAgICAgICAgICAgdmFyIGRyaXZpbmdBY2N1cmFjeSA9IFBsYXllclN0YXRBY2Nlc3Nvci5kcml2aW5nQWNjdXJhY3kocGxheWVyKTtcbiAgICAgICAgICAgIHZhciBsZWZ0VGVuZGVuY3kgPSBQbGF5ZXJTdGF0QWNjZXNzb3IubGVmdFRlbmRlbmN5KHBsYXllcik7XG4gICAgICAgICAgICB2YXIgdGVuZGVuY3k7XG5cbiAgICAgICAgICAgIGlmIChsZWZ0VGVuZGVuY3kgPCA1MCkgdGVuZGVuY3kgPSAncmlnaHQnO1xuICAgICAgICAgICAgaWYgKGxlZnRUZW5kZW5jeSA+IDUwKSB0ZW5kZW5jeSA9ICdsZWZ0JztcblxuICAgICAgICAgICAgLy8gMjA4ICogMjc2XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICc8ZGl2IHN0eWxlPVwid2lkdGg6IDIzMHB4XCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8aW1nIHNyYz1cIicgKyBwbGF5ZXIuYmlvLnBob3RvICsgJ1wiIHN0eWxlPVwiZmxvYXQ6IGxlZnQ7IHdpZHRoOiA1MHB4OyBoZWlnaHQ6IDY2cHg7IG1hcmdpbi1yaWdodDogMTBweDsgYm9yZGVyLXJhZGl1czogMnB4XCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8c3Ryb25nIGNsYXNzPVwicGVwcGVybWludFwiPicgKyBwbGF5ZXIuYmlvLm5hbWUgKyAnPC9zdHJvbmc+PGJyPicgK1xuICAgICAgICAgICAgICAgICAgICBkcml2aW5nRGlzdGFuY2UgKyAnIHlhcmRzJyArXG4gICAgICAgICAgICAgICAgICAgICh0ZW5kZW5jeSA/ICcsICcgKyAodGVuZGVuY3kgPT09ICdsZWZ0JyA/IGxlZnRUZW5kZW5jeSA6ICgxMDAgLSBsZWZ0VGVuZGVuY3kpKSArICclICcgKyB0ZW5kZW5jeSArICcgdGVuZGVuY3knIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgJzxicj4nICtcbiAgICAgICAgICAgICAgICAgICAgJ0RyaXZpbmcgYWNjdXJhY3k6ICcgKyBkcml2aW5nQWNjdXJhY3kgKyAnJTxicj4nICtcbiAgICAgICAgICAgICAgICAgICAgJ0NsdWIgaGVhZCBzcGVlZDogJyArIGNsdWJIZWFkU3BlZWQgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgJGJ1dHRvbnMgPSBkMy5zZWxlY3RBbGwoJyNhY3Rpb25zIGJ1dHRvbicpO1xuXG4gICAgZnVuY3Rpb24gcmVuZGVyKGNvbmZpZykge1xuICAgICAgICB2aWV3LnJlbmRlcihwbGF5ZXJzLCBjb25maWdzW2NvbmZpZ10pO1xuXG4gICAgICAgICRidXR0b25zLmNsYXNzZWQoJ2lzLXNlbGVjdGVkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGQzLnNlbGVjdCh0aGlzKS5hdHRyKCdkYXRhLWNvbmZpZycpID09PSBjb25maWc7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgICRidXR0b25zLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNvbmZpZyA9IGQzLnNlbGVjdCh0aGlzKS5hdHRyKCdkYXRhLWNvbmZpZycpO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCdTd2l0Y2ggY29uZmlnJywgY29uZmlnKTtcblxuICAgICAgICByZW5kZXIoY29uZmlnKTtcbiAgICB9KTtcblxuICAgIGQzLmpzb24oJy9wbGF5ZXJzL3N0YXRzLycgKyBzdGF0cy5qb2luKCcsJyksIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHBsYXllcnMgPSBfXG4gICAgICAgICAgICAuY2hhaW4oZGF0YSlcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHBsYXllcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwbGF5ZXIuc3RhdHMubGVuZ3RoID09PSBzdGF0cy5sZW5ndGg7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKHBsYXllcikge1xuICAgICAgICAgICAgICAgIF8uZWFjaChfLmtleXMocnlkZXJDdXApLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyeWRlckN1cFtrZXldLmluZGV4T2YocGxheWVyLmJpby5uYW1lKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGF5ZXIucnlkZXJDdXAgPSBrZXk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudmFsdWUoKTtcbiAgICAgICAgXG4gICAgICAgIHJlbmRlcigndGVuZGVuY3knKTtcbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXI6IHJlbmRlclxuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRHJpdmluZ1N0YXRzVmlldztcbiIsIi8qZ2xvYmFsIGQzLF8gKi9cblxudmFyIERhdGFBc3BlY3QgID0gcmVxdWlyZSgnLi9hc3BlY3QvRGF0YUFzcGVjdCcpO1xudmFyIENyb3NzaGFpciAgID0gcmVxdWlyZSgnLi9lbGVtZW50L0Nyb3NzaGFpcicpO1xudmFyIE1pZEF4aXMgICAgID0gcmVxdWlyZSgnLi9lbGVtZW50L01pZEF4aXMnKTtcblxudmFyIFRSQU5TSVRJT04gPSAnZXhwJztcbnZhciBUUkFOU0lUSU9OX0lOID0gVFJBTlNJVElPTiArICctaW4nO1xudmFyIFRSQU5TSVRJT05fT1VUID0gVFJBTlNJVElPTiArICctb3V0JztcbnZhciBUUkFOU0lUSU9OX0lOX09VVCA9IFRSQU5TSVRJT04gKyAnLWluLW91dCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY29uZmlnKSB7XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy9cbiAgICAvLyAgUHJvcGVydGllc1xuICAgIC8vXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAgQ29uZmlnXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFxuICAgIHZhciB3aWR0aCAgICAgICA9IGNvbmZpZy53aWR0aDtcbiAgICB2YXIgaGVpZ2h0ICAgICAgPSBjb25maWcuaGVpZ2h0O1xuICAgIHZhciB0aXBMYWJlbCAgICA9IGNvbmZpZy50aXBMYWJlbDtcbiAgICBcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gIEF4ZXNcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICB2YXIgeEF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAgIC5vcmllbnQoJ2JvdHRvbScpXG4gICAgICAgIC5pbm5lclRpY2tTaXplKDApXG4gICAgICAgIC5vdXRlclRpY2tTaXplKDApO1xuICAgIFxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAgRWxlbWVudHNcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgXG4gICAgdmFyICRlbCA9IGQzLnNlbGVjdChjb25maWcuZWwpXG4gICAgICAgIC5hcHBlbmQoJ3N2ZycpXG4gICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH0pO1xuICAgIFxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAgQ3Jvc3NoYWlyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFxuICAgIHZhciBlbGVtZW50T3B0cyA9IF8uZXh0ZW5kKGNvbmZpZywge1xuICAgICAgICBlbDogJGVsLm5vZGUoKVxuICAgIH0pO1xuICAgIFxuICAgIHZhciBtaWRBeGlzID0gTWlkQXhpcyhlbGVtZW50T3B0cyk7XG4gICAgdmFyIGNyb3NzaGFpciA9IENyb3NzaGFpcihlbGVtZW50T3B0cyk7XG4gICAgXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vICBUaXBcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICB2YXIgdGlwID0gZDMudGlwKClcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2QzLXRpcCcpXG4gICAgICAgIC5odG1sKHRpcExhYmVsKTtcblxuICAgICRlbC5jYWxsKHRpcCk7XG4gICAgXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vXG4gICAgLy8gIFJlbmRlcmluZ1xuICAgIC8vXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFxuICAgIGZ1bmN0aW9uIHJlbmRlcihkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBfLmV4dGVuZCh7fSwgY29uZmlnLCBvcHRpb25zKTtcbiAgICAgICAgb3B0aW9ucy5kYXRhQXNwZWN0cyA9IF8uZXh0ZW5kKHt9LCBjb25maWcuZGF0YUFzcGVjdHMsIG9wdGlvbnMuZGF0YUFzcGVjdHMpO1xuXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gIENvbmZpZ1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAgICAgdmFyIGlkICAgICAgICAgID0gb3B0aW9ucy5pZDtcbiAgICAgICAgdmFyIGRhdGFBc3BlY3RzID0gRGF0YUFzcGVjdC52YWxpZGF0ZShvcHRpb25zLmRhdGFBc3BlY3RzKTtcbiAgICAgICAgdmFyIG1hcmdpbiAgICAgID0gb3B0aW9ucy5tYXJnaW4gfHwgMTA7XG4gICAgICAgIHZhciBzb3J0ICAgICAgICA9IG9wdGlvbnMuc29ydDtcbiAgICAgICAgXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gIERhdGFcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBcbiAgICAgICAgXy5lYWNoKGRhdGEsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGQuYXR0cmlidXRlcyA9IHt9O1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gIFNjYWxlc1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIFxuICAgICAgICBfLmNoYWluKGRhdGFBc3BlY3RzKS5rZXlzKCkuZWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIGRhdGFBc3BlY3RzW2tleV0udXBkYXRlKGRhdGEpO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgeFNjYWxlID0gZGF0YUFzcGVjdHMueC5zY2FsZSgpXG4gICAgICAgICAgICAucmFuZ2UoW21hcmdpbiwgd2lkdGggLSBtYXJnaW5dKTtcblxuICAgICAgICB2YXIgeVNjYWxlID0gZGF0YUFzcGVjdHMueS5zY2FsZSgpXG4gICAgICAgICAgICAucmFuZ2UoW21hcmdpbiwgaGVpZ2h0IC0gbWFyZ2luXSk7XG4gICAgICAgIFxuICAgICAgICB4QXhpcy5zY2FsZSh4U2NhbGUpO1xuICAgICAgICBcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvLyAgU2V0dXAgZGF0YVxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAgICAgZGF0YSA9IF9cbiAgICAgICAgICAgIC5jaGFpbihkYXRhKVxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgICAgIF8uZXh0ZW5kKGl0ZW0sIERhdGFBc3BlY3QuZ2V0QXNwZWN0VmFsdWVzKGRhdGFBc3BlY3RzLCBpdGVtKSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnNvcnRCeShkYXRhQXNwZWN0c1tzb3J0XSB8fCBmdW5jdGlvbigpIHsgcmV0dXJuIDAgfSlcbiAgICAgICAgICAgIC52YWx1ZSgpO1xuICAgICAgICBcbiAgICAgICAgdGlwLmRpcmVjdGlvbihmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB2YXIgeSA9IGl0ZW0ueTtcblxuICAgICAgICAgICAgcmV0dXJuIHkgPCAxMDAgPyAncycgOiAnbic7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvLyAgRW50ZXJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBcbiAgICAgICAgdmFyICQgPSB7fTtcbiAgICAgICAgXG4gICAgICAgICQuZGF0YSA9ICRlbFxuICAgICAgICAgICAgLnNlbGVjdEFsbCgnLmRvdCcpXG4gICAgICAgICAgICAuZGF0YShkYXRhLCBpZCk7XG5cbiAgICAgICAgJC5lbnRlciA9ICQuZGF0YS5lbnRlcigpLmNhbGwoZW50ZXIpO1xuXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gIEV4aXRcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBcbiAgICAgICAgJC5leGl0ID0gJC5kYXRhLmV4aXQoKS5jYWxsKGV4aXQpO1xuICAgICAgICBcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvLyAgVXBkYXRlXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgXG4gICAgICAgICRlbC5jYWxsKG1lcmdlKTtcbiAgICAgICAgXG4gICAgICAgIG1pZEF4aXMucmVuZGVyKHhBeGlzKTtcbiAgICAgICAgXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gIEVudGVyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgICAgICBmdW5jdGlvbiBlbnRlcigpIHtcbiAgICAgICAgICAgIHZhciAkID0gdGhpcy5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgICAgIC5jbGFzc2VkKCdkb3QnLCB0cnVlKVxuICAgICAgICAgICAgICAgIC5jbGFzc2VkKCdyeWRlci1ldScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQucnlkZXJDdXAgPT09ICdldSc7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2xhc3NlZCgncnlkZXItdXMnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkLnJ5ZGVyQ3VwID09PSAndXMnO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAkLmNhbGwoY3JlYXRlSGFsbyk7XG4gICAgICAgICAgICAkLmNhbGwoY3JlYXRlRG90KTtcblxuICAgICAgICAgICAgJC5zZWxlY3RBbGwoJ2NpcmNsZScpXG4gICAgICAgICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgICAgICAgICBjeDogXy5wcm9wZXJ0eSgneCcpLFxuICAgICAgICAgICAgICAgICAgICBjeTogeVNjYWxlKDApXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3R5bGUoe1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVIYWxvKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgICAgICAgICAgIC5jbGFzc2VkKCdkb3RfX2hhbG8nLCB0cnVlKVxuICAgICAgICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgcjogMlxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLm9uKCdtb3VzZW92ZXInLCBvbk1vdXNlT3ZlcilcbiAgICAgICAgICAgICAgICAub24oJ21vdXNlb3V0Jywgb25Nb3VzZU91dCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVEb3QoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAgICAgICAgICAgLmNsYXNzZWQoJ2RvdF9fY2lyY2xlJywgdHJ1ZSlcbiAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgIHI6IDhcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdHlsZSh7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvLyAgTWVyZ2VcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBcbiAgICAgICAgZnVuY3Rpb24gbWVyZ2UoKSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdEFsbCgnLmRvdF9faGFsbycpLmNhbGwobWVyZ2VIYWxvKTtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0QWxsKCcuZG90X19jaXJjbGUnKS5jYWxsKG1lcmdlRG90KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZnVuY3Rpb24gbWVyZ2VIYWxvKCkge1xuICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgICAuZWFzZShUUkFOU0lUSU9OX09VVClcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oNjAwKVxuICAgICAgICAgICAgICAgIC5kZWxheShmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkLnggKiAyLjUgKyAyMDA7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgIGN4OiBfLnByb3BlcnR5KCd4JyksXG4gICAgICAgICAgICAgICAgICAgIGN5OiBfLnByb3BlcnR5KCd5JyksXG4gICAgICAgICAgICAgICAgICAgIHI6IF8ucHJvcGVydHkoJ3InKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN0eWxlKHtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogXy5wcm9wZXJ0eSgnYScpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZ1bmN0aW9uIG1lcmdlRG90KCkge1xuICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgICAuZWFzZShUUkFOU0lUSU9OX0lOX09VVClcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oNDAwKVxuICAgICAgICAgICAgICAgIC5kZWxheShmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkLnggKiAyLjU7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgIGN4OiBfLnByb3BlcnR5KCd4JyksXG4gICAgICAgICAgICAgICAgICAgIGN5OiBfLnByb3BlcnR5KCd5JyksXG4gICAgICAgICAgICAgICAgICAgIHI6IDJcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdHlsZSh7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDFcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvLyAgRXhpdFxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIFxuICAgICAgICBmdW5jdGlvbiBleGl0KCkge1xuICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oMzAwKVxuICAgICAgICAgICAgICAgIC5zdHlsZSh7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy9cbiAgICAvLyAgRXZlbnQgaGFuZGxlcnNcbiAgICAvL1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIGZ1bmN0aW9uIG9uTW91c2VPdmVyKHBsYXllcikge1xuICAgICAgICB0aXAuc2hvdyhwbGF5ZXIpO1xuICAgICAgICBjcm9zc2hhaXIuc2hvdyhwbGF5ZXIueCwgcGxheWVyLnkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uTW91c2VPdXQoKSB7XG4gICAgICAgIHRpcC5oaWRlKCk7XG4gICAgICAgIGNyb3NzaGFpci5oaWRlKCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlcjogcmVuZGVyXG4gICAgfTtcbiAgICBcbn07XG4iLCIvKmdsb2JhbCBkMyxfKi9cblxuZnVuY3Rpb24gRGF0YUFzcGVjdCAoY29uZmlnKSB7XG4gICAgaWYgKF8uaXNGdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgIGNvbmZpZyA9IHsgdmFsdWU6IGNvbmZpZyB9O1xuICAgIH1cblxuICAgIHZhciB2YWx1ZSA9IGNvbmZpZy52YWx1ZTtcbiAgICB2YXIgc2NhbGUgPSBjb25maWcuc2NhbGUgfHwgZDMuc2NhbGUubGluZWFyKCk7XG4gICAgdmFyIG1pbiA9IGNvbmZpZy5taW4gfHwgZDMubWluO1xuICAgIHZhciBtYXggPSBjb25maWcubWF4IHx8IGQzLm1heDtcblxuICAgIGZ1bmN0aW9uIGdldFNjYWxlICgpIHtcbiAgICAgICAgcmV0dXJuIHNjYWxlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFZhbHVlIChkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZShkKTtcbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gZ2V0U2NhbGVkVmFsdWUgKGQpIHtcbiAgICAgICAgcmV0dXJuIHNjYWxlKHZhbHVlKGQpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGRhdGUgKGRhdGEsIG9wdGlvbnMpIHtcbiAgICAgICAgY29uZmlnID0gXy5leHRlbmQoY29uZmlnLCBvcHRpb25zKTtcblxuICAgICAgICB2YXIgc2NhbGVNaW47XG4gICAgICAgIHZhciBzY2FsZU1heCA9IG1heChkYXRhLCBnZXRWYWx1ZSk7XG4gICAgICAgIFxuICAgICAgICAvLyBUT0RPOiBCZXR0ZXIgd2F5IHRvIGRvIHRoaXMgd2l0aCBzY2FsZXM/XG4gICAgICAgIGlmICghbWluICYmIGNvbmZpZy5hbGlnbiA9PT0gRGF0YUFzcGVjdC5DRU5UUkUpIHtcbiAgICAgICAgICAgIHNjYWxlTWluID0gLXNjYWxlTWF4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NhbGVNaW4gPSBtaW4oZGF0YSwgZ2V0VmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBzY2FsZS5kb21haW4oW3NjYWxlTWluLCBzY2FsZU1heF0pO1xuICAgIH1cblxuICAgIHJldHVybiBfLmV4dGVuZChnZXRWYWx1ZSwge1xuICAgICAgICBzY2FsZTogZ2V0U2NhbGUsXG4gICAgICAgIHNjYWxlZFZhbHVlOiBnZXRTY2FsZWRWYWx1ZSxcbiAgICAgICAgdXBkYXRlOiB1cGRhdGVcbiAgICB9KTtcbn1cblxuRGF0YUFzcGVjdC5DRU5UUkUgPSAnY2VudHJlJztcblxuRGF0YUFzcGVjdC52YWxpZGF0ZSA9IGZ1bmN0aW9uIChkYXRhQXNwZWN0cykge1xuICAgIGlmIChkYXRhQXNwZWN0cykge1xuICAgICAgICBfLmNoYWluKGRhdGFBc3BlY3RzKVxuICAgICAgICAgICAgLmtleXMoKVxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoZGF0YUFzcGVjdHNba2V5XSBpbnN0YW5jZW9mIERhdGFBc3BlY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFBc3BlY3RzW2tleV0gPSBEYXRhQXNwZWN0KGRhdGFBc3BlY3RzW2tleV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gZGF0YUFzcGVjdHM7XG59O1xuXG5EYXRhQXNwZWN0LmdldEFzcGVjdFZhbHVlcyA9IGZ1bmN0aW9uIChkYXRhQXNwZWN0cywgaXRlbSkge1xuICAgIHJldHVybiBfLnJlZHVjZShfLmtleXMoZGF0YUFzcGVjdHMpLCBmdW5jdGlvbih2YWx1ZXMsIGtleSkge1xuICAgICAgICB2YXIgYXNwZWN0ID0gZGF0YUFzcGVjdHNba2V5XTtcbiAgICAgICAgdmFsdWVzW2tleV0gPSBhc3BlY3Quc2NhbGVkVmFsdWUoaXRlbSk7XG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfSwge30pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEYXRhQXNwZWN0OyIsIi8qZ2xvYmFsIGQzKi9cblxuZnVuY3Rpb24gQ3Jvc3NoYWlyKGNvbmZpZykge1xuICAgIHZhciAkZWwgPSBkMy5zZWxlY3QoY29uZmlnLmVsKS5hcHBlbmQoJ2cnKVxuICAgICAgICAuY2xhc3NlZCgnY3Jvc3NoYWlyJywgdHJ1ZSlcbiAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgMCk7XG4gICAgXG4gICAgdmFyIHdpZHRoID0gY29uZmlnLndpZHRoO1xuICAgIHZhciBoZWlnaHQgPSBjb25maWcuaGVpZ2h0O1xuXG4gICAgdmFyICRjcm9zc2hhaXJMaW5lWCA9ICRlbC5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICB4MTogMCxcbiAgICAgICAgICAgIHgyOiAwLFxuICAgICAgICAgICAgeTE6IC1oZWlnaHQsXG4gICAgICAgICAgICB5MjogaGVpZ2h0XG4gICAgICAgIH0pO1xuXG4gICAgdmFyICRjcm9zc2hhaXJMaW5lWSA9ICRlbC5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICB4MTogLXdpZHRoLFxuICAgICAgICAgICAgeDI6IHdpZHRoLFxuICAgICAgICAgICAgeTE6IDAsXG4gICAgICAgICAgICB5MjogMFxuICAgICAgICB9KTtcbiAgICBcbiAgICBmdW5jdGlvbiBzaG93KHgsIHkpIHtcbiAgICAgICAgJGVsXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgeCArICcsJyArIHkgKyAnKScpXG4gICAgICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAxKTtcbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gaGlkZSgpIHtcbiAgICAgICAgJGVsLnN0eWxlKCdvcGFjaXR5JywgMCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB7XG4gICAgICAgIHNob3c6IHNob3csXG4gICAgICAgIGhpZGU6IGhpZGVcbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENyb3NzaGFpcjsiLCIvKmdsb2JhbCBkMyAqL1xuXG5mdW5jdGlvbiBNaWRBeGlzKGNvbmZpZykge1xuICAgIHZhciAkZWwgPSBkMy5zZWxlY3QoY29uZmlnLmVsKTtcbiAgICB2YXIgd2lkdGggPSBjb25maWcud2lkdGg7XG4gICAgdmFyIGhlaWdodCA9IGNvbmZpZy5oZWlnaHQ7XG4gICAgXG4gICAgdmFyICRtaWRMaW5lID0gJGVsLmFwcGVuZCgnbGluZScpXG4gICAgICAgIC5jbGFzc2VkKCdoYWlybGluZScsIHRydWUpXG4gICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgIHgxOiAwLFxuICAgICAgICAgICAgeDI6IHdpZHRoLFxuICAgICAgICAgICAgeTE6IGhlaWdodCAvIDIsXG4gICAgICAgICAgICB5MjogaGVpZ2h0IC8gMlxuICAgICAgICB9KTtcblxuICAgIHZhciAkYXhpcyA9ICRlbC5hcHBlbmQoJ2cnKVxuICAgICAgICAuY2xhc3NlZCgnYXhpcycsIHRydWUpXG4gICAgICAgIC5jbGFzc2VkKCdheGlzLS14JywgdHJ1ZSk7XG5cbiAgICBmdW5jdGlvbiByZW5kZXIoYXhpcykge1xuICAgICAgICAkYXhpc1xuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwnICsgTWF0aC5yb3VuZChoZWlnaHQgLyAyKSArICcpJylcbiAgICAgICAgICAgIC5jYWxsKGF4aXMpO1xuXG4gICAgICAgICRheGlzXG4gICAgICAgICAgICAuc2VsZWN0QWxsKCcudGljayBsaW5lJylcbiAgICAgICAgICAgIC5hdHRyKCd5MScsIC1oZWlnaHQgKiAwLjUpXG4gICAgICAgICAgICAuYXR0cigneTInLCBoZWlnaHQgKiAwLjUpO1xuXG4gICAgICAgICRheGlzXG4gICAgICAgICAgICAuc2VsZWN0QWxsKCd0ZXh0JylcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAncm90YXRlKC05MCkgdHJhbnNsYXRlKCcgKyAoKGhlaWdodCAqIDAuNSkgLSAxMCkgKyAnLCAtNDApJylcbiAgICAgICAgICAgIC5zdHlsZSgnZm9udC1zaXplJywgJzMwcHgnKVxuICAgICAgICAgICAgLnN0eWxlKCd0ZXh0LWFuY2hvcicsICdlbmQnKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiAkYXhpcztcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyOiByZW5kZXJcbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1pZEF4aXM7Il19
