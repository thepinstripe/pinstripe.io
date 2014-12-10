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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9yaWNoL0RldmVsb3BtZW50L3BpbnN0cmlwZS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3JpY2gvRGV2ZWxvcG1lbnQvcGluc3RyaXBlL2FwcHMvcGdhdG91ci9zcmMvc2NyaXB0cy9jb25maWcvaW5kZXguanMiLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvYXBwcy9wZ2F0b3VyL3NyYy9zY3JpcHRzL2luZGV4LmpzIiwiL1VzZXJzL3JpY2gvRGV2ZWxvcG1lbnQvcGluc3RyaXBlL2FwcHMvcGdhdG91ci9zcmMvc2NyaXB0cy9tb2RlbC9QbGF5ZXJTdGF0QWNjZXNzb3IuanMiLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvYXBwcy9wZ2F0b3VyL3NyYy9zY3JpcHRzL3ZpZXcvRHJpdmluZ1N0YXRzVmlldy5qcyIsIi9Vc2Vycy9yaWNoL0RldmVsb3BtZW50L3BpbnN0cmlwZS9hcHBzL3BnYXRvdXIvc3JjL3NjcmlwdHMvdmlldy9ncmFwaC9TY2F0dGVyR3JhcGguanMiLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvYXBwcy9wZ2F0b3VyL3NyYy9zY3JpcHRzL3ZpZXcvZ3JhcGgvYXNwZWN0L0RhdGFBc3BlY3QuanMiLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvYXBwcy9wZ2F0b3VyL3NyYy9zY3JpcHRzL3ZpZXcvZ3JhcGgvZWxlbWVudC9Dcm9zc2hhaXIuanMiLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvYXBwcy9wZ2F0b3VyL3NyYy9zY3JpcHRzL3ZpZXcvZ3JhcGgvZWxlbWVudC9NaWRBeGlzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgXG4gICAgcnlkZXJDdXA6IHtcbiAgICAgICAgdXM6ICdSaWNraWUgRm93bGVyLEppbSBGdXJ5ayxaYWNoIEpvaG5zb24sTWF0dCBLdWNoYXIsUGhpbCBNaWNrZWxzb24sUGF0cmljayBSZWVkLEpvcmRhbiBTcGlldGgsSmltbXkgV2Fsa2VyLEJ1YmJhIFdhdHNvbixLZWVnYW4gQnJhZGxleSxIdW50ZXIgTWFoYW4sV2ViYiBTaW1wc29uJy5zcGxpdCgnLCcpLFxuICAgICAgICBldTogJ1Rob21hcyBCam9ybixKYW1pZSBEb25hbGRzb24sVmljdG9yIER1YnVpc3NvbixTZXJnaW8gR2FyY2lhLE1hcnRpbiBLYXltZXIsR3JhZW1lIE1jRG93ZWxsLFJvcnkgTWNJbHJveSxKdXN0aW4gUm9zZSxIZW5yaWsgU3RlbnNvbixTdGVwaGVuIEdhbGxhY2hlcixJYW4gUG91bHRlcixMZWUgV2VzdHdvb2QnLnNwbGl0KCcsJylcbiAgICB9XG4gICAgXG59OyIsIi8qZ2xvYmFsIGQzLF8qL1xuXG52YXIgRHJpdmluZ1N0YXRzVmlldyA9IHJlcXVpcmUoJy4vdmlldy9Ecml2aW5nU3RhdHNWaWV3Jyk7XG5cbkRyaXZpbmdTdGF0c1ZpZXcoe1xuICAgIGVsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZ3JhcGgnKVxufSk7IiwidmFyIGFjY2Vzc29ycyA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgZHJpdmluZ0Rpc3RhbmNlID0gc3RhdEFjY2Vzc29yKCdEcml2aW5nIERpc3RhbmNlJyk7XG4gICAgdmFyIGRyaXZpbmdBY2N1cmFjeSA9IHN0YXRBY2Nlc3NvcignRHJpdmluZyBBY2N1cmFjeSBQZXJjZW50YWdlJyk7XG4gICAgdmFyIGxlZnRUZW5kZW5jeSAgICA9IHN0YXRBY2Nlc3NvcignTGVmdCBUZW5kZW5jeScpO1xuICAgIHZhciBjbHViSGVhZFNwZWVkICAgPSBzdGF0QWNjZXNzb3IoJ0NsdWIgSGVhZCBTcGVlZCcpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZHJpdmluZ0Rpc3RhbmNlOiBkcml2aW5nRGlzdGFuY2UsXG4gICAgICAgIGRyaXZpbmdBY2N1cmFjeTogZHJpdmluZ0FjY3VyYWN5LFxuICAgICAgICBjbHViSGVhZFNwZWVkOiBjbHViSGVhZFNwZWVkLFxuICAgICAgICBsZWZ0VGVuZGVuY3k6IGxlZnRUZW5kZW5jeSxcbiAgICAgICAgdGVuZGVuY3k6IGZ1bmN0aW9uKHBsYXllcikge1xuICAgICAgICAgICAgdmFyIGx0ID0gbGVmdFRlbmRlbmN5KHBsYXllcik7XG4gICAgICAgICAgICB2YXIgcnQgPSAxMDAgLSBsdDtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHJ0IC0gNTA7XG5cbiAgICAgICAgICAgIGlmIChsdCA+IHJ0KSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSAtKGx0IC0gNTApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9O1xufSkoKTtcblxuZnVuY3Rpb24gc3RhdEFjY2Vzc29yKHN0YXROYW1lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHBsYXllcikge1xuICAgICAgICBpZiAoIV8uaXNVbmRlZmluZWQocGxheWVyLmF0dHJpYnV0ZXNbc3RhdE5hbWVdKSkge1xuICAgICAgICAgICAgcmV0dXJuIHBsYXllci5hdHRyaWJ1dGVzW3N0YXROYW1lXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdGF0ID0gXy5maW5kKHBsYXllci5zdGF0cywgZnVuY3Rpb24oc3RhdCkge1xuICAgICAgICAgICAgcmV0dXJuIHN0YXQubmFtZSA9PT0gc3RhdE5hbWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzdGF0ID9cbiAgICAgICAgICAgIChwbGF5ZXIuYXR0cmlidXRlc1tzdGF0TmFtZV0gPSBfLnBhcnNlSW50KHN0YXQudmFsdWUpKSA6XG4gICAgICAgICAgICB1bmRlZmluZWQ7XG4gICAgfTtcbn1cblxuYWNjZXNzb3JzLmFjY2Vzc29yID0gc3RhdEFjY2Vzc29yO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFjY2Vzc29ycztcbiIsIi8qZ2xvYmFsIGQzLF8qL1xuXG52YXIgY29uZmlnICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4uL2NvbmZpZycpO1xudmFyIFNjYXR0ZXJHcmFwaCAgICAgICAgPSByZXF1aXJlKCcuL2dyYXBoL1NjYXR0ZXJHcmFwaCcpO1xudmFyIERhdGFBc3BlY3QgICAgICAgICAgPSByZXF1aXJlKCcuL2dyYXBoL2FzcGVjdC9EYXRhQXNwZWN0Jyk7XG52YXIgUGxheWVyU3RhdEFjY2Vzc29yICA9IHJlcXVpcmUoJy4uL21vZGVsL1BsYXllclN0YXRBY2Nlc3NvcicpO1xuXG52YXIgc3RhdHMgPSAnMTAxLDEwMiwwMjQyMiwwMjQyMywwMjQwMScuc3BsaXQoJywnKTtcbnZhciByeWRlckN1cCA9IGNvbmZpZy5yeWRlckN1cDtcblxuZnVuY3Rpb24gRHJpdmluZ1N0YXRzVmlldyAob3B0aW9ucykge1xuICAgIFxuICAgIHZhciBwbGF5ZXJzO1xuICAgIFxuICAgIHZhciBjb25maWdzID0ge1xuICAgICAgICB0ZW5kZW5jeToge1xuICAgICAgICAgICAgLy8gSnVzdCBkZWZhdWx0c1xuICAgICAgICB9LFxuICAgICAgICBhY2N1cmFjeToge1xuICAgICAgICAgICAgZGF0YUFzcGVjdHM6IHtcbiAgICAgICAgICAgICAgICBhOiB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBmdW5jdGlvbiAocGxheWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMC41O1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBzY2FsZTogZDMuc2NhbGUubGluZWFyKCkucmFuZ2UoWzAuMSwgMC41XSlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHk6IHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIChwbGF5ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9ICgxMDAgLSBQbGF5ZXJTdGF0QWNjZXNzb3IuZHJpdmluZ0FjY3VyYWN5KHBsYXllcikpIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZWZ0VGVuZGVuY3kgPSBQbGF5ZXJTdGF0QWNjZXNzb3IubGVmdFRlbmRlbmN5KHBsYXllcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNMZWZ0ID0gbGVmdFRlbmRlbmN5ID4gNTA7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpc0xlZnQgPyAtdmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc2NhbGU6IGQzLnNjYWxlLnBvdygpLmV4cG9uZW50KDEuNSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHZpZXcgPSBTY2F0dGVyR3JhcGgoe1xuICAgICAgICBlbDogb3B0aW9ucy5lbCxcbiAgICAgICAgaWQ6IF8ucHJvcGVydHkoJ2lkJyksXG4gICAgICAgIHdpZHRoOiAxMDI0LFxuICAgICAgICBoZWlnaHQ6IDcwMCxcbiAgICAgICAgc29ydDogJ3InLFxuICAgICAgICBkYXRhQXNwZWN0czoge1xuICAgICAgICAgICAgeDogUGxheWVyU3RhdEFjY2Vzc29yLmRyaXZpbmdEaXN0YW5jZSxcbiAgICAgICAgICAgIHk6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogUGxheWVyU3RhdEFjY2Vzc29yLnRlbmRlbmN5LFxuICAgICAgICAgICAgICAgIGFsaWduOiBEYXRhQXNwZWN0LkNFTlRSRVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHI6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogUGxheWVyU3RhdEFjY2Vzc29yLmRyaXZpbmdBY2N1cmFjeSxcbiAgICAgICAgICAgICAgICBzY2FsZTogZDMuc2NhbGUubGluZWFyKCkucmFuZ2UoWzEyLCA0XSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IFBsYXllclN0YXRBY2Nlc3Nvci5jbHViSGVhZFNwZWVkLFxuICAgICAgICAgICAgICAgIHNjYWxlOiBkMy5zY2FsZS5saW5lYXIoKS5yYW5nZShbMC4xLCAwLjVdKVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0aXBMYWJlbDogZnVuY3Rpb24gKHBsYXllcikge1xuICAgICAgICAgICAgdmFyIGRyaXZpbmdEaXN0YW5jZSA9IFBsYXllclN0YXRBY2Nlc3Nvci5kcml2aW5nRGlzdGFuY2UocGxheWVyKTtcbiAgICAgICAgICAgIHZhciBjbHViSGVhZFNwZWVkID0gUGxheWVyU3RhdEFjY2Vzc29yLmNsdWJIZWFkU3BlZWQocGxheWVyKTtcbiAgICAgICAgICAgIHZhciBkcml2aW5nQWNjdXJhY3kgPSBQbGF5ZXJTdGF0QWNjZXNzb3IuZHJpdmluZ0FjY3VyYWN5KHBsYXllcik7XG4gICAgICAgICAgICB2YXIgbGVmdFRlbmRlbmN5ID0gUGxheWVyU3RhdEFjY2Vzc29yLmxlZnRUZW5kZW5jeShwbGF5ZXIpO1xuICAgICAgICAgICAgdmFyIHRlbmRlbmN5O1xuXG4gICAgICAgICAgICBpZiAobGVmdFRlbmRlbmN5IDwgNTApIHRlbmRlbmN5ID0gJ3JpZ2h0JztcbiAgICAgICAgICAgIGlmIChsZWZ0VGVuZGVuY3kgPiA1MCkgdGVuZGVuY3kgPSAnbGVmdCc7XG5cbiAgICAgICAgICAgIC8vIDIwOCAqIDI3NlxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAnPGRpdiBzdHlsZT1cIndpZHRoOiAyMzBweFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGltZyBzcmM9XCInICsgcGxheWVyLmJpby5waG90byArICdcIiBzdHlsZT1cImZsb2F0OiBsZWZ0OyB3aWR0aDogNTBweDsgaGVpZ2h0OiA2NnB4OyBtYXJnaW4tcmlnaHQ6IDEwcHg7IGJvcmRlci1yYWRpdXM6IDJweFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPHN0cm9uZyBjbGFzcz1cInBlcHBlcm1pbnRcIj4nICsgcGxheWVyLmJpby5uYW1lICsgJzwvc3Ryb25nPjxicj4nICtcbiAgICAgICAgICAgICAgICAgICAgZHJpdmluZ0Rpc3RhbmNlICsgJyB5YXJkcycgK1xuICAgICAgICAgICAgICAgICAgICAodGVuZGVuY3kgPyAnLCAnICsgKHRlbmRlbmN5ID09PSAnbGVmdCcgPyBsZWZ0VGVuZGVuY3kgOiAoMTAwIC0gbGVmdFRlbmRlbmN5KSkgKyAnJSAnICsgdGVuZGVuY3kgKyAnIHRlbmRlbmN5JyA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgICc8YnI+JyArXG4gICAgICAgICAgICAgICAgICAgICdEcml2aW5nIGFjY3VyYWN5OiAnICsgZHJpdmluZ0FjY3VyYWN5ICsgJyU8YnI+JyArXG4gICAgICAgICAgICAgICAgICAgICdDbHViIGhlYWQgc3BlZWQ6ICcgKyBjbHViSGVhZFNwZWVkICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+J1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyICRidXR0b25zID0gZDMuc2VsZWN0QWxsKCcjYWN0aW9ucyBidXR0b24nKTtcblxuICAgIGZ1bmN0aW9uIHJlbmRlcihjb25maWcpIHtcbiAgICAgICAgdmlldy5yZW5kZXIocGxheWVycywgY29uZmlnc1tjb25maWddKTtcblxuICAgICAgICAkYnV0dG9ucy5jbGFzc2VkKCdpcy1zZWxlY3RlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBkMy5zZWxlY3QodGhpcykuYXR0cignZGF0YS1jb25maWcnKSA9PT0gY29uZmlnO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAkYnV0dG9ucy5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb25maWcgPSBkMy5zZWxlY3QodGhpcykuYXR0cignZGF0YS1jb25maWcnKTtcblxuICAgICAgICBjb25zb2xlLmxvZygnU3dpdGNoIGNvbmZpZycsIGNvbmZpZyk7XG5cbiAgICAgICAgcmVuZGVyKGNvbmZpZyk7XG4gICAgfSk7XG5cbiAgICBkMy5qc29uKCcvcGxheWVycy9zdGF0cy8nICsgc3RhdHMuam9pbignLCcpLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBwbGF5ZXJzID0gX1xuICAgICAgICAgICAgLmNoYWluKGRhdGEpXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChwbGF5ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGxheWVyLnN0YXRzLmxlbmd0aCA9PT0gc3RhdHMubGVuZ3RoO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uIChwbGF5ZXIpIHtcbiAgICAgICAgICAgICAgICBfLmVhY2goXy5rZXlzKHJ5ZGVyQ3VwKSwgZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocnlkZXJDdXBba2V5XS5pbmRleE9mKHBsYXllci5iaW8ubmFtZSkgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGxheWVyLnJ5ZGVyQ3VwID0ga2V5O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnZhbHVlKCk7XG4gICAgICAgIFxuICAgICAgICByZW5kZXIoJ3RlbmRlbmN5Jyk7XG4gICAgfSk7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyOiByZW5kZXJcbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERyaXZpbmdTdGF0c1ZpZXc7XG4iLCIvKmdsb2JhbCBkMyxfICovXG5cbnZhciBEYXRhQXNwZWN0ICA9IHJlcXVpcmUoJy4vYXNwZWN0L0RhdGFBc3BlY3QnKTtcbnZhciBDcm9zc2hhaXIgICA9IHJlcXVpcmUoJy4vZWxlbWVudC9Dcm9zc2hhaXInKTtcbnZhciBNaWRBeGlzICAgICA9IHJlcXVpcmUoJy4vZWxlbWVudC9NaWRBeGlzJyk7XG5cbnZhciBUUkFOU0lUSU9OID0gJ2V4cCc7XG52YXIgVFJBTlNJVElPTl9JTiA9IFRSQU5TSVRJT04gKyAnLWluJztcbnZhciBUUkFOU0lUSU9OX09VVCA9IFRSQU5TSVRJT04gKyAnLW91dCc7XG52YXIgVFJBTlNJVElPTl9JTl9PVVQgPSBUUkFOU0lUSU9OICsgJy1pbi1vdXQnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGNvbmZpZykge1xuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vXG4gICAgLy8gIFByb3BlcnRpZXNcbiAgICAvL1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gIENvbmZpZ1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBcbiAgICB2YXIgd2lkdGggICAgICAgPSBjb25maWcud2lkdGg7XG4gICAgdmFyIGhlaWdodCAgICAgID0gY29uZmlnLmhlaWdodDtcbiAgICB2YXIgdGlwTGFiZWwgICAgPSBjb25maWcudGlwTGFiZWw7XG4gICAgXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vICBBeGVzXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgdmFyIHhBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAub3JpZW50KCdib3R0b20nKVxuICAgICAgICAuaW5uZXJUaWNrU2l6ZSgwKVxuICAgICAgICAub3V0ZXJUaWNrU2l6ZSgwKTtcbiAgICBcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gIEVsZW1lbnRzXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFxuICAgIHZhciAkZWwgPSBkMy5zZWxlY3QoY29uZmlnLmVsKVxuICAgICAgICAuYXBwZW5kKCdzdmcnKVxuICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICB9KTtcbiAgICBcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gIENyb3NzaGFpclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBcbiAgICB2YXIgZWxlbWVudE9wdHMgPSBfLmV4dGVuZChjb25maWcsIHtcbiAgICAgICAgZWw6ICRlbC5ub2RlKClcbiAgICB9KTtcbiAgICBcbiAgICB2YXIgbWlkQXhpcyA9IE1pZEF4aXMoZWxlbWVudE9wdHMpO1xuICAgIHZhciBjcm9zc2hhaXIgPSBDcm9zc2hhaXIoZWxlbWVudE9wdHMpO1xuICAgIFxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAgVGlwXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgdmFyIHRpcCA9IGQzLnRpcCgpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdkMy10aXAnKVxuICAgICAgICAuaHRtbCh0aXBMYWJlbCk7XG5cbiAgICAkZWwuY2FsbCh0aXApO1xuICAgIFxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvL1xuICAgIC8vICBSZW5kZXJpbmdcbiAgICAvL1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBcbiAgICBmdW5jdGlvbiByZW5kZXIoZGF0YSwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gXy5leHRlbmQoe30sIGNvbmZpZywgb3B0aW9ucyk7XG4gICAgICAgIG9wdGlvbnMuZGF0YUFzcGVjdHMgPSBfLmV4dGVuZCh7fSwgY29uZmlnLmRhdGFBc3BlY3RzLCBvcHRpb25zLmRhdGFBc3BlY3RzKTtcblxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vICBDb25maWdcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgICAgIHZhciBpZCAgICAgICAgICA9IG9wdGlvbnMuaWQ7XG4gICAgICAgIHZhciBkYXRhQXNwZWN0cyA9IERhdGFBc3BlY3QudmFsaWRhdGUob3B0aW9ucy5kYXRhQXNwZWN0cyk7XG4gICAgICAgIHZhciBtYXJnaW4gICAgICA9IG9wdGlvbnMubWFyZ2luIHx8IDEwO1xuICAgICAgICB2YXIgc29ydCAgICAgICAgPSBvcHRpb25zLnNvcnQ7XG4gICAgICAgIFxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vICBEYXRhXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgXG4gICAgICAgIF8uZWFjaChkYXRhLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBkLmF0dHJpYnV0ZXMgPSB7fTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vICBTY2FsZXNcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBcbiAgICAgICAgXy5jaGFpbihkYXRhQXNwZWN0cykua2V5cygpLmVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBkYXRhQXNwZWN0c1trZXldLnVwZGF0ZShkYXRhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHhTY2FsZSA9IGRhdGFBc3BlY3RzLnguc2NhbGUoKVxuICAgICAgICAgICAgLnJhbmdlKFttYXJnaW4sIHdpZHRoIC0gbWFyZ2luXSk7XG5cbiAgICAgICAgdmFyIHlTY2FsZSA9IGRhdGFBc3BlY3RzLnkuc2NhbGUoKVxuICAgICAgICAgICAgLnJhbmdlKFttYXJnaW4sIGhlaWdodCAtIG1hcmdpbl0pO1xuICAgICAgICBcbiAgICAgICAgeEF4aXMuc2NhbGUoeFNjYWxlKTtcbiAgICAgICAgXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gIFNldHVwIGRhdGFcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgICAgIGRhdGEgPSBfXG4gICAgICAgICAgICAuY2hhaW4oZGF0YSlcbiAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICBfLmV4dGVuZChpdGVtLCBEYXRhQXNwZWN0LmdldEFzcGVjdFZhbHVlcyhkYXRhQXNwZWN0cywgaXRlbSkpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zb3J0QnkoZGF0YUFzcGVjdHNbc29ydF0gfHwgZnVuY3Rpb24oKSB7IHJldHVybiAwIH0pXG4gICAgICAgICAgICAudmFsdWUoKTtcbiAgICAgICAgXG4gICAgICAgIHRpcC5kaXJlY3Rpb24oZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgdmFyIHkgPSBpdGVtLnk7XG5cbiAgICAgICAgICAgIHJldHVybiB5IDwgMTAwID8gJ3MnIDogJ24nO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gIEVudGVyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgXG4gICAgICAgIHZhciAkID0ge307XG4gICAgICAgIFxuICAgICAgICAkLmRhdGEgPSAkZWxcbiAgICAgICAgICAgIC5zZWxlY3RBbGwoJy5kb3QnKVxuICAgICAgICAgICAgLmRhdGEoZGF0YSwgaWQpO1xuXG4gICAgICAgICQuZW50ZXIgPSAkLmRhdGEuZW50ZXIoKS5jYWxsKGVudGVyKTtcblxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vICBFeGl0XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgXG4gICAgICAgICQuZXhpdCA9ICQuZGF0YS5leGl0KCkuY2FsbChleGl0KTtcbiAgICAgICAgXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gIFVwZGF0ZVxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIFxuICAgICAgICAkZWwuY2FsbChtZXJnZSk7XG4gICAgICAgIFxuICAgICAgICBtaWRBeGlzLnJlbmRlcih4QXhpcyk7XG4gICAgICAgIFxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vICBFbnRlclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAgICAgZnVuY3Rpb24gZW50ZXIoKSB7XG4gICAgICAgICAgICB2YXIgJCA9IHRoaXMuYXBwZW5kKCdnJylcbiAgICAgICAgICAgICAgICAuY2xhc3NlZCgnZG90JywgdHJ1ZSlcbiAgICAgICAgICAgICAgICAuY2xhc3NlZCgncnlkZXItZXUnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkLnJ5ZGVyQ3VwID09PSAnZXUnO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNsYXNzZWQoJ3J5ZGVyLXVzJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZC5yeWRlckN1cCA9PT0gJ3VzJztcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJC5jYWxsKGNyZWF0ZUhhbG8pO1xuICAgICAgICAgICAgJC5jYWxsKGNyZWF0ZURvdCk7XG5cbiAgICAgICAgICAgICQuc2VsZWN0QWxsKCdjaXJjbGUnKVxuICAgICAgICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgY3g6IF8ucHJvcGVydHkoJ3gnKSxcbiAgICAgICAgICAgICAgICAgICAgY3k6IHlTY2FsZSgwKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN0eWxlKHtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlSGFsbygpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgICAgICAgICAgICAuY2xhc3NlZCgnZG90X19oYWxvJywgdHJ1ZSlcbiAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgIHI6IDJcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5vbignbW91c2VvdmVyJywgb25Nb3VzZU92ZXIpXG4gICAgICAgICAgICAgICAgLm9uKCdtb3VzZW91dCcsIG9uTW91c2VPdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlRG90KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgICAgICAgICAgIC5jbGFzc2VkKCdkb3RfX2NpcmNsZScsIHRydWUpXG4gICAgICAgICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgICAgICAgICByOiA4XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3R5bGUoe1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gIE1lcmdlXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgXG4gICAgICAgIGZ1bmN0aW9uIG1lcmdlKCkge1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RBbGwoJy5kb3RfX2hhbG8nKS5jYWxsKG1lcmdlSGFsbyk7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdEFsbCgnLmRvdF9fY2lyY2xlJykuY2FsbChtZXJnZURvdCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZ1bmN0aW9uIG1lcmdlSGFsbygpIHtcbiAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgLmVhc2UoVFJBTlNJVElPTl9PVVQpXG4gICAgICAgICAgICAgICAgLmR1cmF0aW9uKDYwMClcbiAgICAgICAgICAgICAgICAuZGVsYXkoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZC54ICogMi41ICsgMjAwO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgICAgICAgICBjeDogXy5wcm9wZXJ0eSgneCcpLFxuICAgICAgICAgICAgICAgICAgICBjeTogXy5wcm9wZXJ0eSgneScpLFxuICAgICAgICAgICAgICAgICAgICByOiBfLnByb3BlcnR5KCdyJylcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdHlsZSh7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IF8ucHJvcGVydHkoJ2EnKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmdW5jdGlvbiBtZXJnZURvdCgpIHtcbiAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgLmVhc2UoVFJBTlNJVElPTl9JTl9PVVQpXG4gICAgICAgICAgICAgICAgLmR1cmF0aW9uKDQwMClcbiAgICAgICAgICAgICAgICAuZGVsYXkoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZC54ICogMi41O1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgICAgICAgICBjeDogXy5wcm9wZXJ0eSgneCcpLFxuICAgICAgICAgICAgICAgICAgICBjeTogXy5wcm9wZXJ0eSgneScpLFxuICAgICAgICAgICAgICAgICAgICByOiAyXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3R5bGUoe1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAxXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gIEV4aXRcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBcbiAgICAgICAgZnVuY3Rpb24gZXhpdCgpIHtcbiAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgLmR1cmF0aW9uKDMwMClcbiAgICAgICAgICAgICAgICAuc3R5bGUoe1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vXG4gICAgLy8gIEV2ZW50IGhhbmRsZXJzXG4gICAgLy9cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBmdW5jdGlvbiBvbk1vdXNlT3ZlcihwbGF5ZXIpIHtcbiAgICAgICAgdGlwLnNob3cocGxheWVyKTtcbiAgICAgICAgY3Jvc3NoYWlyLnNob3cocGxheWVyLngsIHBsYXllci55KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbk1vdXNlT3V0KCkge1xuICAgICAgICB0aXAuaGlkZSgpO1xuICAgICAgICBjcm9zc2hhaXIuaGlkZSgpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXI6IHJlbmRlclxuICAgIH07XG4gICAgXG59O1xuIiwiLypnbG9iYWwgZDMsXyovXG5cbmZ1bmN0aW9uIERhdGFBc3BlY3QgKGNvbmZpZykge1xuICAgIGlmIChfLmlzRnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICBjb25maWcgPSB7IHZhbHVlOiBjb25maWcgfTtcbiAgICB9XG5cbiAgICB2YXIgdmFsdWUgPSBjb25maWcudmFsdWU7XG4gICAgdmFyIHNjYWxlID0gY29uZmlnLnNjYWxlIHx8IGQzLnNjYWxlLmxpbmVhcigpO1xuICAgIHZhciBtaW4gPSBjb25maWcubWluIHx8IGQzLm1pbjtcbiAgICB2YXIgbWF4ID0gY29uZmlnLm1heCB8fCBkMy5tYXg7XG5cbiAgICBmdW5jdGlvbiBnZXRTY2FsZSAoKSB7XG4gICAgICAgIHJldHVybiBzY2FsZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRWYWx1ZSAoZCkge1xuICAgICAgICByZXR1cm4gdmFsdWUoZCk7XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIGdldFNjYWxlZFZhbHVlIChkKSB7XG4gICAgICAgIHJldHVybiBzY2FsZSh2YWx1ZShkKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlIChkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgIGNvbmZpZyA9IF8uZXh0ZW5kKGNvbmZpZywgb3B0aW9ucyk7XG5cbiAgICAgICAgdmFyIHNjYWxlTWluO1xuICAgICAgICB2YXIgc2NhbGVNYXggPSBtYXgoZGF0YSwgZ2V0VmFsdWUpO1xuICAgICAgICBcbiAgICAgICAgLy8gVE9ETzogQmV0dGVyIHdheSB0byBkbyB0aGlzIHdpdGggc2NhbGVzP1xuICAgICAgICBpZiAoIW1pbiAmJiBjb25maWcuYWxpZ24gPT09IERhdGFBc3BlY3QuQ0VOVFJFKSB7XG4gICAgICAgICAgICBzY2FsZU1pbiA9IC1zY2FsZU1heDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxlTWluID0gbWluKGRhdGEsIGdldFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgc2NhbGUuZG9tYWluKFtzY2FsZU1pbiwgc2NhbGVNYXhdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gXy5leHRlbmQoZ2V0VmFsdWUsIHtcbiAgICAgICAgc2NhbGU6IGdldFNjYWxlLFxuICAgICAgICBzY2FsZWRWYWx1ZTogZ2V0U2NhbGVkVmFsdWUsXG4gICAgICAgIHVwZGF0ZTogdXBkYXRlXG4gICAgfSk7XG59XG5cbkRhdGFBc3BlY3QuQ0VOVFJFID0gJ2NlbnRyZSc7XG5cbkRhdGFBc3BlY3QudmFsaWRhdGUgPSBmdW5jdGlvbiAoZGF0YUFzcGVjdHMpIHtcbiAgICBpZiAoZGF0YUFzcGVjdHMpIHtcbiAgICAgICAgXy5jaGFpbihkYXRhQXNwZWN0cylcbiAgICAgICAgICAgIC5rZXlzKClcbiAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgICAgIGlmICghKGRhdGFBc3BlY3RzW2tleV0gaW5zdGFuY2VvZiBEYXRhQXNwZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhQXNwZWN0c1trZXldID0gRGF0YUFzcGVjdChkYXRhQXNwZWN0c1trZXldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGRhdGFBc3BlY3RzO1xufTtcblxuRGF0YUFzcGVjdC5nZXRBc3BlY3RWYWx1ZXMgPSBmdW5jdGlvbiAoZGF0YUFzcGVjdHMsIGl0ZW0pIHtcbiAgICByZXR1cm4gXy5yZWR1Y2UoXy5rZXlzKGRhdGFBc3BlY3RzKSwgZnVuY3Rpb24odmFsdWVzLCBrZXkpIHtcbiAgICAgICAgdmFyIGFzcGVjdCA9IGRhdGFBc3BlY3RzW2tleV07XG4gICAgICAgIHZhbHVlc1trZXldID0gYXNwZWN0LnNjYWxlZFZhbHVlKGl0ZW0pO1xuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH0sIHt9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRGF0YUFzcGVjdDsiLCIvKmdsb2JhbCBkMyovXG5cbmZ1bmN0aW9uIENyb3NzaGFpcihjb25maWcpIHtcbiAgICB2YXIgJGVsID0gZDMuc2VsZWN0KGNvbmZpZy5lbCkuYXBwZW5kKCdnJylcbiAgICAgICAgLmNsYXNzZWQoJ2Nyb3NzaGFpcicsIHRydWUpXG4gICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIDApO1xuICAgIFxuICAgIHZhciB3aWR0aCA9IGNvbmZpZy53aWR0aDtcbiAgICB2YXIgaGVpZ2h0ID0gY29uZmlnLmhlaWdodDtcblxuICAgIHZhciAkY3Jvc3NoYWlyTGluZVggPSAkZWwuYXBwZW5kKCdsaW5lJylcbiAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgeDE6IDAsXG4gICAgICAgICAgICB4MjogMCxcbiAgICAgICAgICAgIHkxOiAtaGVpZ2h0LFxuICAgICAgICAgICAgeTI6IGhlaWdodFxuICAgICAgICB9KTtcblxuICAgIHZhciAkY3Jvc3NoYWlyTGluZVkgPSAkZWwuYXBwZW5kKCdsaW5lJylcbiAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgeDE6IC13aWR0aCxcbiAgICAgICAgICAgIHgyOiB3aWR0aCxcbiAgICAgICAgICAgIHkxOiAwLFxuICAgICAgICAgICAgeTI6IDBcbiAgICAgICAgfSk7XG4gICAgXG4gICAgZnVuY3Rpb24gc2hvdyh4LCB5KSB7XG4gICAgICAgICRlbFxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHggKyAnLCcgKyB5ICsgJyknKVxuICAgICAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgMSk7XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIGhpZGUoKSB7XG4gICAgICAgICRlbC5zdHlsZSgnb3BhY2l0eScsIDApO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgICBzaG93OiBzaG93LFxuICAgICAgICBoaWRlOiBoaWRlXG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDcm9zc2hhaXI7IiwiLypnbG9iYWwgZDMgKi9cblxuZnVuY3Rpb24gTWlkQXhpcyhjb25maWcpIHtcbiAgICB2YXIgJGVsID0gZDMuc2VsZWN0KGNvbmZpZy5lbCk7XG4gICAgdmFyIHdpZHRoID0gY29uZmlnLndpZHRoO1xuICAgIHZhciBoZWlnaHQgPSBjb25maWcuaGVpZ2h0O1xuICAgIFxuICAgIHZhciAkbWlkTGluZSA9ICRlbC5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAuY2xhc3NlZCgnaGFpcmxpbmUnLCB0cnVlKVxuICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICB4MTogMCxcbiAgICAgICAgICAgIHgyOiB3aWR0aCxcbiAgICAgICAgICAgIHkxOiBoZWlnaHQgLyAyLFxuICAgICAgICAgICAgeTI6IGhlaWdodCAvIDJcbiAgICAgICAgfSk7XG5cbiAgICB2YXIgJGF4aXMgPSAkZWwuYXBwZW5kKCdnJylcbiAgICAgICAgLmNsYXNzZWQoJ2F4aXMnLCB0cnVlKVxuICAgICAgICAuY2xhc3NlZCgnYXhpcy0teCcsIHRydWUpO1xuXG4gICAgZnVuY3Rpb24gcmVuZGVyKGF4aXMpIHtcbiAgICAgICAgJGF4aXNcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsJyArIE1hdGgucm91bmQoaGVpZ2h0IC8gMikgKyAnKScpXG4gICAgICAgICAgICAuY2FsbChheGlzKTtcblxuICAgICAgICAkYXhpc1xuICAgICAgICAgICAgLnNlbGVjdEFsbCgnLnRpY2sgbGluZScpXG4gICAgICAgICAgICAuYXR0cigneTEnLCAtaGVpZ2h0ICogMC41KVxuICAgICAgICAgICAgLmF0dHIoJ3kyJywgaGVpZ2h0ICogMC41KTtcblxuICAgICAgICAkYXhpc1xuICAgICAgICAgICAgLnNlbGVjdEFsbCgndGV4dCcpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3JvdGF0ZSgtOTApIHRyYW5zbGF0ZSgnICsgKChoZWlnaHQgKiAwLjUpIC0gMTApICsgJywgLTQwKScpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZvbnQtc2l6ZScsICczMHB4JylcbiAgICAgICAgICAgIC5zdHlsZSgndGV4dC1hbmNob3InLCAnZW5kJyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gJGF4aXM7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlcjogcmVuZGVyXG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNaWRBeGlzOyJdfQ==
