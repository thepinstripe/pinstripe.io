(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Action = {};

Action.STATS_LOADED = 'stats:loaded';

module.exports = Action;
},{}],2:[function(require,module,exports){
/*global _ */

var Dispatcher  = require('./Dispatcher');
var config      = require('../config');

module.exports = {

    loadStats: function () {
        var stats = config.statIds;

        d3.json('/apps/pgatour/players/stats/' + stats.join(','), function (data) {
            Dispatcher.statsLoaded(data);
        });
    }

};
},{"../config":5,"./Dispatcher":3}],3:[function(require,module,exports){
/*global DeLorean,_ */

var Action = require('./Action');
var PlayerStore = require('../model/PlayerStore');

var playerStore = new PlayerStore();

module.exports = DeLorean.Flux.createDispatcher({

    statsLoaded: function (data) {
        this.dispatch(Action.STATS_LOADED, data);
    },

    getStores: function () {
        return {
            players: playerStore
        };
    }

});

},{"../model/PlayerStore":8,"./Action":1}],4:[function(require,module,exports){
module.exports=require(3)
},{"../model/PlayerStore":8,"./Action":1}],5:[function(require,module,exports){
module.exports = {
    
    ryderCup: {
        us: 'Rickie Fowler,Jim Furyk,Zach Johnson,Matt Kuchar,Phil Mickelson,Patrick Reed,Jordan Spieth,Jimmy Walker,Bubba Watson,Keegan Bradley,Hunter Mahan,Webb Simpson'.split(','),
        eu: 'Thomas Bjorn,Jamie Donaldson,Victor Dubuisson,Sergio Garcia,Martin Kaymer,Graeme McDowell,Rory McIlroy,Justin Rose,Henrik Stenson,Stephen Gallacher,Ian Poulter,Lee Westwood'.split(',')
    },

    statIds: '101,102,02422,02423,02401'.split(',')
    
};
},{}],6:[function(require,module,exports){
/** @jsx React.DOM */

var Dispatcher      = require('./app/Dispatcher');
var ActionCreator   = require('./app/ActionCreator');
var MainView        = require('./view/MainView.jsx');

module.exports = function (config) {
    var view = MainView({dispatcher: Dispatcher });

    ActionCreator.loadStats();

    return view;
};

},{"./app/ActionCreator":2,"./app/Dispatcher":3,"./view/MainView.jsx":10}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
/*global DeLorean */

var App = require('../app');
var Action = require('../app/Action');
var config = require('../config');

var actions = {};
actions[Action.STATS_LOADED] = 'setStats';

module.exports = DeLorean.Flux.createStore({

    actions: actions,

    initialize: function () {
        this.data = {};
    },

    setStats: function (data) {
        var ryderCup = config.ryderCup;
        var statIds = config.statIds;

        this.data.players = _
            .chain(data)
            .filter(function (player) {
                return player.stats.length === statIds.length;
            })
            .each(function (player) {
                _.each(_.keys(ryderCup), function (key) {
                    if (ryderCup[key].indexOf(player.bio.name) >= 0) {
                        player.ryderCup = key;
                    }
                });
            })
            .value();

        this.emitChange();
    },

    getState: function () {
        return this.data;
    }

});
},{"../app":4,"../app/Action":1,"../config":5}],9:[function(require,module,exports){
/** @jsx React.DOM *//*global d3,_,DeLorean*/

/** @jsx React.DOM */

var config              = require('../config');
var ScatterGraph        = require('./graph/ScatterGraph');
var DataAspect          = require('./graph/aspect/DataAspect');
var PlayerStatAccessor  = require('../model/PlayerStatAccessor');

var ryderCup = config.ryderCup;

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

var DrivingStatsView = React.createClass({displayName: 'DrivingStatsView',

    getInitialState: function () {
        return {
            mode: 'tendency',
            modes: [
                { mode: 'accuracy', label: 'Driving Accuracy' },
                { mode: 'tendency', label: 'Driving Tendency' }
            ]
        };
    },

    render: function () {
        return (
            React.DOM.section({className: "content"}, 
                React.DOM.h2(null, "PGA Tour Driving Stats, 2014"), 
                React.DOM.article({className: "graph"}, 
                     this.renderActions() 
                ), 
                React.DOM.div({ref: "container"})
            )
        );
    },

    renderActions: function () {
        return (
            React.DOM.div({id: "actions", className: "hlist pull--right"}, 
                 this.state.modes.map(this.renderAction) 
            )
        );
    },

    renderAction: function (config) {
        return (
            ActionButton({
                key:  config.mode, 
                mode:  config.mode, 
                label:  config.label, 
                selected:  config.mode === this.state.mode, 
                onClick:  this.switchMode}
                )
        );
    },

    componentDidMount: function () {
        this.componentDidUpdate();
    },

    componentDidUpdate: function () {
        if (!this.view) {
            this.createView();
        }

        if (this.props.data) {
            this.view.render(this.props.data, configs[this.state.mode]);
        }
    },

    createView: function () {
        var el = this.refs.container.getDOMNode();

        this.view = ScatterGraph({
            el: el,
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
                var clubHeadSpeed   = PlayerStatAccessor.clubHeadSpeed(player);
                var drivingAccuracy = PlayerStatAccessor.drivingAccuracy(player);
                var leftTendency    = PlayerStatAccessor.leftTendency(player);
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
    },

    switchMode: function (mode) {
        this.setState({
            mode: mode
        });
    }

});

var ActionButton = React.createClass({displayName: 'ActionButton',

    render: function () {
        var classSet = React.addons.classSet({
            'hlist__item': true,
            'toggle': true,
            'is-selected': this.props.selected
        });

        return (
            React.DOM.button({
                className: classSet, 
                onClick:  this.onToggleClick
                }, 
                 this.props.label
            )
        );
    },

    onToggleClick: function () {
        this.props.onClick(this.props.mode);
    }

});

module.exports = DrivingStatsView;

},{"../config":5,"../model/PlayerStatAccessor":7,"./graph/ScatterGraph":11,"./graph/aspect/DataAspect":12}],10:[function(require,module,exports){
/** @jsx React.DOM */

var Flux = DeLorean.Flux;
var DrivingStatsView = require('./DrivingStatsView.jsx');

module.exports = React.createClass({displayName: 'exports',

    mixins: [Flux.mixins.storeListener],

    render: function () {
        var data = this.getStore('players').players;

        return (
            DrivingStatsView({data: data })
        );
    }

});
},{"./DrivingStatsView.jsx":9}],11:[function(require,module,exports){
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

},{"./aspect/DataAspect":12,"./element/Crosshair":13,"./element/MidAxis":14}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
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
},{}],15:[function(require,module,exports){
var apps = {};

function register (name, module) {
    module.name = name;
    apps[name] = module;
}

function get (name) {
    return apps[name];
}

module.exports = {
    register: register,
    get: get
};
},{}],16:[function(require,module,exports){
/*global d3 */

var colours = {
    navy:       '#16191e',
    contrast:   '#fff',
    chrome:     '#edecf1',
    lemon:      '#f1e400',
    pear:       '#c8d300',
    spearmint:  '#7dcad3',
    peppermint: '#3bb8bb'
};

module.exports = {
    
    palette: {
        colours: colours,
        scale: [
            colours.lemon,
            colours.pear,
            colours.spearmint,
            colours.peppermint,
            colours.contrast,
            colours.chrome
        ]
    }
    
};
},{}],17:[function(require,module,exports){
var ApplicationView = require('./view/ApplicationView.jsx');

var AppRegistry = require('./app/AppRegistry');
AppRegistry.register('pgatour', require('../../apps/pgatour/src/scripts'));

var appView = React.renderComponent(ApplicationView(), document.getElementById('global'));
},{"../../apps/pgatour/src/scripts":6,"./app/AppRegistry":15,"./view/ApplicationView.jsx":18}],18:[function(require,module,exports){
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
            React.DOM.div(null, 
                Header({scrollY:  this.state.scrollY, documentHeight:  document.body.offsetHeight}), 
                React.DOM.div({ref: "appContainer", className: "appcontainer"}, 
                     this.app
                )
            )
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
},{"../app/AppRegistry":15,"./component/Header.jsx":19,"./helper/ScrollHandler":20}],19:[function(require,module,exports){
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
            React.DOM.header({className: "header"}, 
                React.DOM.div({id: "header-logo", className: "header__logo", style: { 'border-color': accent}}, 
                     this.renderLogo(accent) 
                )
            )
        );
    },

    renderLogo: function (accent) {
        return (
            React.DOM.svg({xmlns: "http://www.w3.org/2000/svg", width: "34", height: "290"}, 
                React.DOM.rect({x: "0", y: "247.2", style: { fill: accent}, width: "33.2", height: "1.6"}), 
                React.DOM.path({style: { fill: accent}, d: "M.9 241.8c-.6 0-1-.4-1-1 0-.3.1-.6.4-.8l30.7-31h-30.8v-1.6h32.2c.6 0 1 .4 1 1 0 .3-.1.6-.4.8l-30.7 31h31.1v1.6h-32.5z"}), 
                React.DOM.rect({x: "0", y: "79.2", fill: "#3CB7BA", width: "33.2", height: "1.6"}), 
                React.DOM.path({fill: "#EDEBF1", d: "M19.2 74.7v-23.4c0-1.8-.2-3.5-.5-5-.4-1.5-.9-2.7-1.6-3.8-.7-1-1.6-1.9-2.6-2.4s-2.3-.9-3.8-.9c-1.4 0-2.7.3-3.8.9-1.1.6-2 1.4-2.8 2.4-.7 1.1-1.3 2.3-1.7 3.8-.4 1.5-.6 3.1-.6 4.9v23.4h-1.6v-23.3c0-2 .2-3.8.6-5.4.4-1.7 1.1-3.1 2-4.3.9-1.2 2-2.2 3.3-2.9 1.3-.7 2.8-1 4.6-1 1.7 0 3.2.3 4.5 1 1.3.7 2.3 1.6 3.2 2.9.8 1.2 1.4 2.7 1.8 4.3.4 1.6.6 3.5.6 5.4v21.8h12.7v1.6h-14.3z"}), 
                React.DOM.rect({x: "31.7", style: { fill: accent}, width: "1.6", height: "34.4"}), 
                React.DOM.rect({x: "0", fill: "#EDEBF1", width: "1.6", height: "34.4"}), 
                React.DOM.rect({x: "15.5", fill: "#EDEBF1", width: "1.6", height: "34.4"}), 
                React.DOM.path({style: { fill: accent}, d: "M19.2 290.3v-23.4c0-1.8-.2-3.5-.5-5-.4-1.5-.9-2.7-1.6-3.8-.7-1-1.6-1.9-2.6-2.4-1.1-.6-2.3-.9-3.8-.9-1.4 0-2.7.3-3.8.9-1.1.6-2 1.4-2.8 2.4-.7 1.1-1.3 2.3-1.7 3.8-.4 1.5-.6 3.1-.6 4.9v23.4h-1.6v-23.4c0-2 .2-3.8.6-5.4.4-1.7 1.1-3.1 2-4.3.9-1.2 2-2.2 3.3-2.9 1.3-.7 2.8-1 4.6-1 1.7 0 3.2.3 4.5 1 1.3.7 2.3 1.6 3.2 2.9.8 1.2 1.4 2.7 1.8 4.3.4 1.6.6 3.5.6 5.4v21.8h12.7v1.6h-14.3z"}), 
                React.DOM.path({fill: "#7EC9D3", d: "M31.9 203.1v-25.1c0-3.7-.6-6.5-1.8-8.2-1.1-1.7-3-2.5-5.6-2.5-2.6 0-4.3.8-5.3 2.5-1.1 1.8-1.6 4.5-1.6 8.2v12.8c0 4-.6 7.1-1.9 9.1-1.3 2.1-3.5 3.2-6.6 3.2-3.1 0-5.4-1.1-6.8-3.1-1.4-2-2.1-5.1-2.1-9.2v-89.3c0-2 .2-3.8.6-5.4.4-1.7 1.1-3.1 2-4.3.9-1.2 2-2.2 3.3-2.9 1.3-.7 2.8-1 4.6-1 1.7 0 3.2.3 4.5 1 1.3.7 2.3 1.6 3.2 2.9.8 1.2 1.4 2.7 1.8 4.3.3 1.2.4 2.5.5 3.8l12.8-15.9v2.6l-12.7 15.8v20.9h12.7v1.6h-14.3v-23.4c0-1.8-.2-3.5-.5-5-.4-1.5-.9-2.7-1.6-3.8-.7-1-1.6-1.9-2.6-2.4-1.1-.6-2.3-.9-3.8-.9-1.4 0-2.7.3-3.8.9-1.1.6-2 1.4-2.8 2.4-.7 1.1-1.3 2.3-1.7 3.8-.4 1.5-.6 3.1-.6 4.9v43.7h31.7v1.6h-31.7v44c0 3.7.6 6.5 1.8 8.2 1.1 1.7 3 2.5 5.6 2.5 2.6 0 4.3-.8 5.3-2.5 1-1.8 1.6-4.5 1.6-8.2v-12.7c0-4 .6-7.1 1.9-9.1 1.3-2.1 3.5-3.2 6.6-3.2 3.1 0 5.4 1.1 6.8 3.1 1.4 2 2.1 5.1 2.1 9.2v25.2h-1.6z"})
            )
        );
    }
    
});
},{"../../config":16}],20:[function(require,module,exports){
function ScrollHandler(config) {
    var scrollTicker;
    var resizeTicker;

    function init() {
        scrollTicker = ticker({
            value: windowScroll,
            handler: config.onScroll
        });

        resizeTicker = ticker({
            value: windowSize,
            handler: config.onResize,
            matcher: function(currSize, lastSize) {
                return (lastSize.width === currSize.width) && (lastSize.height === currSize.height);
            }
        });

        d3.select(window)
            .on('scroll', scrollTicker.defer)
            .on('resize', resizeTicker.defer);
    }

    function ticker(options) {
        var current = options.value(),
            matcher = options.matcher || defaultMatcher,
            last,
            ticking;

        function tick() {
            if (!matcher(current, last)) {
                current = last;
                options.handler(current);
            }

            ticking = false;
        }

        function defer() {
            last = options.value();

            if (!ticking) {
                requestAnimationFrame(tick);
                ticking = true;
            }
        }

        function defaultMatcher(current, last) {
            return (current === last);
        }

        return {
            defer: defer
        };
    }

    function windowSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    function windowScroll() {
        return window.scrollY || document.documentElement.scrollTop;
    }

    return {
        init: init
    };
}

module.exports = ScrollHandler;
},{}]},{},[17])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9yaWNoL0RldmVsb3BtZW50L3BpbnN0cmlwZS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3JpY2gvRGV2ZWxvcG1lbnQvcGluc3RyaXBlL2FwcHMvcGdhdG91ci9zcmMvc2NyaXB0cy9hcHAvQWN0aW9uLmpzIiwiL1VzZXJzL3JpY2gvRGV2ZWxvcG1lbnQvcGluc3RyaXBlL2FwcHMvcGdhdG91ci9zcmMvc2NyaXB0cy9hcHAvQWN0aW9uQ3JlYXRvci5qcyIsIi9Vc2Vycy9yaWNoL0RldmVsb3BtZW50L3BpbnN0cmlwZS9hcHBzL3BnYXRvdXIvc3JjL3NjcmlwdHMvYXBwL0Rpc3BhdGNoZXIuanMiLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvYXBwcy9wZ2F0b3VyL3NyYy9zY3JpcHRzL2NvbmZpZy9pbmRleC5qcyIsIi9Vc2Vycy9yaWNoL0RldmVsb3BtZW50L3BpbnN0cmlwZS9hcHBzL3BnYXRvdXIvc3JjL3NjcmlwdHMvaW5kZXguanMiLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvYXBwcy9wZ2F0b3VyL3NyYy9zY3JpcHRzL21vZGVsL1BsYXllclN0YXRBY2Nlc3Nvci5qcyIsIi9Vc2Vycy9yaWNoL0RldmVsb3BtZW50L3BpbnN0cmlwZS9hcHBzL3BnYXRvdXIvc3JjL3NjcmlwdHMvbW9kZWwvUGxheWVyU3RvcmUuanMiLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvYXBwcy9wZ2F0b3VyL3NyYy9zY3JpcHRzL3ZpZXcvRHJpdmluZ1N0YXRzVmlldy5qc3giLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvYXBwcy9wZ2F0b3VyL3NyYy9zY3JpcHRzL3ZpZXcvTWFpblZpZXcuanN4IiwiL1VzZXJzL3JpY2gvRGV2ZWxvcG1lbnQvcGluc3RyaXBlL2FwcHMvcGdhdG91ci9zcmMvc2NyaXB0cy92aWV3L2dyYXBoL1NjYXR0ZXJHcmFwaC5qcyIsIi9Vc2Vycy9yaWNoL0RldmVsb3BtZW50L3BpbnN0cmlwZS9hcHBzL3BnYXRvdXIvc3JjL3NjcmlwdHMvdmlldy9ncmFwaC9hc3BlY3QvRGF0YUFzcGVjdC5qcyIsIi9Vc2Vycy9yaWNoL0RldmVsb3BtZW50L3BpbnN0cmlwZS9hcHBzL3BnYXRvdXIvc3JjL3NjcmlwdHMvdmlldy9ncmFwaC9lbGVtZW50L0Nyb3NzaGFpci5qcyIsIi9Vc2Vycy9yaWNoL0RldmVsb3BtZW50L3BpbnN0cmlwZS9hcHBzL3BnYXRvdXIvc3JjL3NjcmlwdHMvdmlldy9ncmFwaC9lbGVtZW50L01pZEF4aXMuanMiLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvc3JjL3NjcmlwdHMvYXBwL0FwcFJlZ2lzdHJ5LmpzIiwiL1VzZXJzL3JpY2gvRGV2ZWxvcG1lbnQvcGluc3RyaXBlL3NyYy9zY3JpcHRzL2NvbmZpZy9pbmRleC5qcyIsIi9Vc2Vycy9yaWNoL0RldmVsb3BtZW50L3BpbnN0cmlwZS9zcmMvc2NyaXB0cy9pbmRleC5qcyIsIi9Vc2Vycy9yaWNoL0RldmVsb3BtZW50L3BpbnN0cmlwZS9zcmMvc2NyaXB0cy92aWV3L0FwcGxpY2F0aW9uVmlldy5qc3giLCIvVXNlcnMvcmljaC9EZXZlbG9wbWVudC9waW5zdHJpcGUvc3JjL3NjcmlwdHMvdmlldy9jb21wb25lbnQvSGVhZGVyLmpzeCIsIi9Vc2Vycy9yaWNoL0RldmVsb3BtZW50L3BpbnN0cmlwZS9zcmMvc2NyaXB0cy92aWV3L2hlbHBlci9TY3JvbGxIYW5kbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgQWN0aW9uID0ge307XG5cbkFjdGlvbi5TVEFUU19MT0FERUQgPSAnc3RhdHM6bG9hZGVkJztcblxubW9kdWxlLmV4cG9ydHMgPSBBY3Rpb247IiwiLypnbG9iYWwgXyAqL1xuXG52YXIgRGlzcGF0Y2hlciAgPSByZXF1aXJlKCcuL0Rpc3BhdGNoZXInKTtcbnZhciBjb25maWcgICAgICA9IHJlcXVpcmUoJy4uL2NvbmZpZycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIGxvYWRTdGF0czogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc3RhdHMgPSBjb25maWcuc3RhdElkcztcblxuICAgICAgICBkMy5qc29uKCcvYXBwcy9wZ2F0b3VyL3BsYXllcnMvc3RhdHMvJyArIHN0YXRzLmpvaW4oJywnKSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIERpc3BhdGNoZXIuc3RhdHNMb2FkZWQoZGF0YSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxufTsiLCIvKmdsb2JhbCBEZUxvcmVhbixfICovXG5cbnZhciBBY3Rpb24gPSByZXF1aXJlKCcuL0FjdGlvbicpO1xudmFyIFBsYXllclN0b3JlID0gcmVxdWlyZSgnLi4vbW9kZWwvUGxheWVyU3RvcmUnKTtcblxudmFyIHBsYXllclN0b3JlID0gbmV3IFBsYXllclN0b3JlKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRGVMb3JlYW4uRmx1eC5jcmVhdGVEaXNwYXRjaGVyKHtcblxuICAgIHN0YXRzTG9hZGVkOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICB0aGlzLmRpc3BhdGNoKEFjdGlvbi5TVEFUU19MT0FERUQsIGRhdGEpO1xuICAgIH0sXG5cbiAgICBnZXRTdG9yZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBsYXllcnM6IHBsYXllclN0b3JlXG4gICAgICAgIH07XG4gICAgfVxuXG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFxuICAgIHJ5ZGVyQ3VwOiB7XG4gICAgICAgIHVzOiAnUmlja2llIEZvd2xlcixKaW0gRnVyeWssWmFjaCBKb2huc29uLE1hdHQgS3VjaGFyLFBoaWwgTWlja2Vsc29uLFBhdHJpY2sgUmVlZCxKb3JkYW4gU3BpZXRoLEppbW15IFdhbGtlcixCdWJiYSBXYXRzb24sS2VlZ2FuIEJyYWRsZXksSHVudGVyIE1haGFuLFdlYmIgU2ltcHNvbicuc3BsaXQoJywnKSxcbiAgICAgICAgZXU6ICdUaG9tYXMgQmpvcm4sSmFtaWUgRG9uYWxkc29uLFZpY3RvciBEdWJ1aXNzb24sU2VyZ2lvIEdhcmNpYSxNYXJ0aW4gS2F5bWVyLEdyYWVtZSBNY0Rvd2VsbCxSb3J5IE1jSWxyb3ksSnVzdGluIFJvc2UsSGVucmlrIFN0ZW5zb24sU3RlcGhlbiBHYWxsYWNoZXIsSWFuIFBvdWx0ZXIsTGVlIFdlc3R3b29kJy5zcGxpdCgnLCcpXG4gICAgfSxcblxuICAgIHN0YXRJZHM6ICcxMDEsMTAyLDAyNDIyLDAyNDIzLDAyNDAxJy5zcGxpdCgnLCcpXG4gICAgXG59OyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgRGlzcGF0Y2hlciAgICAgID0gcmVxdWlyZSgnLi9hcHAvRGlzcGF0Y2hlcicpO1xudmFyIEFjdGlvbkNyZWF0b3IgICA9IHJlcXVpcmUoJy4vYXBwL0FjdGlvbkNyZWF0b3InKTtcbnZhciBNYWluVmlldyAgICAgICAgPSByZXF1aXJlKCcuL3ZpZXcvTWFpblZpZXcuanN4Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciB2aWV3ID0gTWFpblZpZXcoe2Rpc3BhdGNoZXI6IERpc3BhdGNoZXIgfSk7XG5cbiAgICBBY3Rpb25DcmVhdG9yLmxvYWRTdGF0cygpO1xuXG4gICAgcmV0dXJuIHZpZXc7XG59O1xuIiwidmFyIGFjY2Vzc29ycyA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgZHJpdmluZ0Rpc3RhbmNlID0gc3RhdEFjY2Vzc29yKCdEcml2aW5nIERpc3RhbmNlJyk7XG4gICAgdmFyIGRyaXZpbmdBY2N1cmFjeSA9IHN0YXRBY2Nlc3NvcignRHJpdmluZyBBY2N1cmFjeSBQZXJjZW50YWdlJyk7XG4gICAgdmFyIGxlZnRUZW5kZW5jeSAgICA9IHN0YXRBY2Nlc3NvcignTGVmdCBUZW5kZW5jeScpO1xuICAgIHZhciBjbHViSGVhZFNwZWVkICAgPSBzdGF0QWNjZXNzb3IoJ0NsdWIgSGVhZCBTcGVlZCcpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZHJpdmluZ0Rpc3RhbmNlOiBkcml2aW5nRGlzdGFuY2UsXG4gICAgICAgIGRyaXZpbmdBY2N1cmFjeTogZHJpdmluZ0FjY3VyYWN5LFxuICAgICAgICBjbHViSGVhZFNwZWVkOiBjbHViSGVhZFNwZWVkLFxuICAgICAgICBsZWZ0VGVuZGVuY3k6IGxlZnRUZW5kZW5jeSxcbiAgICAgICAgdGVuZGVuY3k6IGZ1bmN0aW9uKHBsYXllcikge1xuICAgICAgICAgICAgdmFyIGx0ID0gbGVmdFRlbmRlbmN5KHBsYXllcik7XG4gICAgICAgICAgICB2YXIgcnQgPSAxMDAgLSBsdDtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHJ0IC0gNTA7XG5cbiAgICAgICAgICAgIGlmIChsdCA+IHJ0KSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSAtKGx0IC0gNTApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9O1xufSkoKTtcblxuZnVuY3Rpb24gc3RhdEFjY2Vzc29yKHN0YXROYW1lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHBsYXllcikge1xuICAgICAgICBpZiAoIV8uaXNVbmRlZmluZWQocGxheWVyLmF0dHJpYnV0ZXNbc3RhdE5hbWVdKSkge1xuICAgICAgICAgICAgcmV0dXJuIHBsYXllci5hdHRyaWJ1dGVzW3N0YXROYW1lXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdGF0ID0gXy5maW5kKHBsYXllci5zdGF0cywgZnVuY3Rpb24oc3RhdCkge1xuICAgICAgICAgICAgcmV0dXJuIHN0YXQubmFtZSA9PT0gc3RhdE5hbWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzdGF0ID9cbiAgICAgICAgICAgIChwbGF5ZXIuYXR0cmlidXRlc1tzdGF0TmFtZV0gPSBfLnBhcnNlSW50KHN0YXQudmFsdWUpKSA6XG4gICAgICAgICAgICB1bmRlZmluZWQ7XG4gICAgfTtcbn1cblxuYWNjZXNzb3JzLmFjY2Vzc29yID0gc3RhdEFjY2Vzc29yO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFjY2Vzc29ycztcbiIsIi8qZ2xvYmFsIERlTG9yZWFuICovXG5cbnZhciBBcHAgPSByZXF1aXJlKCcuLi9hcHAnKTtcbnZhciBBY3Rpb24gPSByZXF1aXJlKCcuLi9hcHAvQWN0aW9uJyk7XG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJyk7XG5cbnZhciBhY3Rpb25zID0ge307XG5hY3Rpb25zW0FjdGlvbi5TVEFUU19MT0FERURdID0gJ3NldFN0YXRzJztcblxubW9kdWxlLmV4cG9ydHMgPSBEZUxvcmVhbi5GbHV4LmNyZWF0ZVN0b3JlKHtcblxuICAgIGFjdGlvbnM6IGFjdGlvbnMsXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IHt9O1xuICAgIH0sXG5cbiAgICBzZXRTdGF0czogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgdmFyIHJ5ZGVyQ3VwID0gY29uZmlnLnJ5ZGVyQ3VwO1xuICAgICAgICB2YXIgc3RhdElkcyA9IGNvbmZpZy5zdGF0SWRzO1xuXG4gICAgICAgIHRoaXMuZGF0YS5wbGF5ZXJzID0gX1xuICAgICAgICAgICAgLmNoYWluKGRhdGEpXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChwbGF5ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGxheWVyLnN0YXRzLmxlbmd0aCA9PT0gc3RhdElkcy5sZW5ndGg7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKHBsYXllcikge1xuICAgICAgICAgICAgICAgIF8uZWFjaChfLmtleXMocnlkZXJDdXApLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyeWRlckN1cFtrZXldLmluZGV4T2YocGxheWVyLmJpby5uYW1lKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGF5ZXIucnlkZXJDdXAgPSBrZXk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudmFsdWUoKTtcblxuICAgICAgICB0aGlzLmVtaXRDaGFuZ2UoKTtcbiAgICB9LFxuXG4gICAgZ2V0U3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgICB9XG5cbn0pOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qZ2xvYmFsIGQzLF8sRGVMb3JlYW4qL1xuXG4vKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIGNvbmZpZyAgICAgICAgICAgICAgPSByZXF1aXJlKCcuLi9jb25maWcnKTtcbnZhciBTY2F0dGVyR3JhcGggICAgICAgID0gcmVxdWlyZSgnLi9ncmFwaC9TY2F0dGVyR3JhcGgnKTtcbnZhciBEYXRhQXNwZWN0ICAgICAgICAgID0gcmVxdWlyZSgnLi9ncmFwaC9hc3BlY3QvRGF0YUFzcGVjdCcpO1xudmFyIFBsYXllclN0YXRBY2Nlc3NvciAgPSByZXF1aXJlKCcuLi9tb2RlbC9QbGF5ZXJTdGF0QWNjZXNzb3InKTtcblxudmFyIHJ5ZGVyQ3VwID0gY29uZmlnLnJ5ZGVyQ3VwO1xuXG52YXIgY29uZmlncyA9IHtcbiAgICB0ZW5kZW5jeToge1xuICAgICAgICAvLyBKdXN0IGRlZmF1bHRzXG4gICAgfSxcbiAgICBhY2N1cmFjeToge1xuICAgICAgICBkYXRhQXNwZWN0czoge1xuICAgICAgICAgICAgYToge1xuICAgICAgICAgICAgICAgIHZhbHVlOiBmdW5jdGlvbiAocGxheWVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwLjU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzY2FsZTogZDMuc2NhbGUubGluZWFyKCkucmFuZ2UoWzAuMSwgMC41XSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB5OiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIChwbGF5ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gKDEwMCAtIFBsYXllclN0YXRBY2Nlc3Nvci5kcml2aW5nQWNjdXJhY3kocGxheWVyKSkgLyAyO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGVmdFRlbmRlbmN5ID0gUGxheWVyU3RhdEFjY2Vzc29yLmxlZnRUZW5kZW5jeShwbGF5ZXIpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXNMZWZ0ID0gbGVmdFRlbmRlbmN5ID4gNTA7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlzTGVmdCA/IC12YWx1ZSA6IHZhbHVlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2NhbGU6IGQzLnNjYWxlLnBvdygpLmV4cG9uZW50KDEuNSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbnZhciBEcml2aW5nU3RhdHNWaWV3ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnRHJpdmluZ1N0YXRzVmlldycsXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1vZGU6ICd0ZW5kZW5jeScsXG4gICAgICAgICAgICBtb2RlczogW1xuICAgICAgICAgICAgICAgIHsgbW9kZTogJ2FjY3VyYWN5JywgbGFiZWw6ICdEcml2aW5nIEFjY3VyYWN5JyB9LFxuICAgICAgICAgICAgICAgIHsgbW9kZTogJ3RlbmRlbmN5JywgbGFiZWw6ICdEcml2aW5nIFRlbmRlbmN5JyB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgUmVhY3QuRE9NLnNlY3Rpb24oe2NsYXNzTmFtZTogXCJjb250ZW50XCJ9LCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uaDIobnVsbCwgXCJQR0EgVG91ciBEcml2aW5nIFN0YXRzLCAyMDE0XCIpLCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uYXJ0aWNsZSh7Y2xhc3NOYW1lOiBcImdyYXBoXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyQWN0aW9ucygpIFxuICAgICAgICAgICAgICAgICksIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe3JlZjogXCJjb250YWluZXJcIn0pXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIHJlbmRlckFjdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2lkOiBcImFjdGlvbnNcIiwgY2xhc3NOYW1lOiBcImhsaXN0IHB1bGwtLXJpZ2h0XCJ9LCBcbiAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5tb2Rlcy5tYXAodGhpcy5yZW5kZXJBY3Rpb24pIFxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICByZW5kZXJBY3Rpb246IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIEFjdGlvbkJ1dHRvbih7XG4gICAgICAgICAgICAgICAga2V5OiAgY29uZmlnLm1vZGUsIFxuICAgICAgICAgICAgICAgIG1vZGU6ICBjb25maWcubW9kZSwgXG4gICAgICAgICAgICAgICAgbGFiZWw6ICBjb25maWcubGFiZWwsIFxuICAgICAgICAgICAgICAgIHNlbGVjdGVkOiAgY29uZmlnLm1vZGUgPT09IHRoaXMuc3RhdGUubW9kZSwgXG4gICAgICAgICAgICAgICAgb25DbGljazogIHRoaXMuc3dpdGNoTW9kZX1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50RGlkVXBkYXRlKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMudmlldykge1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVWaWV3KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5kYXRhKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcucmVuZGVyKHRoaXMucHJvcHMuZGF0YSwgY29uZmlnc1t0aGlzLnN0YXRlLm1vZGVdKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjcmVhdGVWaWV3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlbCA9IHRoaXMucmVmcy5jb250YWluZXIuZ2V0RE9NTm9kZSgpO1xuXG4gICAgICAgIHRoaXMudmlldyA9IFNjYXR0ZXJHcmFwaCh7XG4gICAgICAgICAgICBlbDogZWwsXG4gICAgICAgICAgICBpZDogXy5wcm9wZXJ0eSgnaWQnKSxcbiAgICAgICAgICAgIHdpZHRoOiAxMDI0LFxuICAgICAgICAgICAgaGVpZ2h0OiA3MDAsXG4gICAgICAgICAgICBzb3J0OiAncicsXG4gICAgICAgICAgICBkYXRhQXNwZWN0czoge1xuICAgICAgICAgICAgICAgIHg6IFBsYXllclN0YXRBY2Nlc3Nvci5kcml2aW5nRGlzdGFuY2UsXG4gICAgICAgICAgICAgICAgeToge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogUGxheWVyU3RhdEFjY2Vzc29yLnRlbmRlbmN5LFxuICAgICAgICAgICAgICAgICAgICBhbGlnbjogRGF0YUFzcGVjdC5DRU5UUkVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHI6IHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IFBsYXllclN0YXRBY2Nlc3Nvci5kcml2aW5nQWNjdXJhY3ksXG4gICAgICAgICAgICAgICAgICAgIHNjYWxlOiBkMy5zY2FsZS5saW5lYXIoKS5yYW5nZShbMTIsIDRdKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYToge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogUGxheWVyU3RhdEFjY2Vzc29yLmNsdWJIZWFkU3BlZWQsXG4gICAgICAgICAgICAgICAgICAgIHNjYWxlOiBkMy5zY2FsZS5saW5lYXIoKS5yYW5nZShbMC4xLCAwLjVdKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0aXBMYWJlbDogZnVuY3Rpb24gKHBsYXllcikge1xuICAgICAgICAgICAgICAgIHZhciBkcml2aW5nRGlzdGFuY2UgPSBQbGF5ZXJTdGF0QWNjZXNzb3IuZHJpdmluZ0Rpc3RhbmNlKHBsYXllcik7XG4gICAgICAgICAgICAgICAgdmFyIGNsdWJIZWFkU3BlZWQgICA9IFBsYXllclN0YXRBY2Nlc3Nvci5jbHViSGVhZFNwZWVkKHBsYXllcik7XG4gICAgICAgICAgICAgICAgdmFyIGRyaXZpbmdBY2N1cmFjeSA9IFBsYXllclN0YXRBY2Nlc3Nvci5kcml2aW5nQWNjdXJhY3kocGxheWVyKTtcbiAgICAgICAgICAgICAgICB2YXIgbGVmdFRlbmRlbmN5ICAgID0gUGxheWVyU3RhdEFjY2Vzc29yLmxlZnRUZW5kZW5jeShwbGF5ZXIpO1xuICAgICAgICAgICAgICAgIHZhciB0ZW5kZW5jeTtcblxuICAgICAgICAgICAgICAgIGlmIChsZWZ0VGVuZGVuY3kgPCA1MCkgdGVuZGVuY3kgPSAncmlnaHQnO1xuICAgICAgICAgICAgICAgIGlmIChsZWZ0VGVuZGVuY3kgPiA1MCkgdGVuZGVuY3kgPSAnbGVmdCc7XG5cbiAgICAgICAgICAgICAgICAvLyAyMDggKiAyNzZcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAnPGRpdiBzdHlsZT1cIndpZHRoOiAyMzBweFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbWcgc3JjPVwiJyArIHBsYXllci5iaW8ucGhvdG8gKyAnXCIgc3R5bGU9XCJmbG9hdDogbGVmdDsgd2lkdGg6IDUwcHg7IGhlaWdodDogNjZweDsgbWFyZ2luLXJpZ2h0OiAxMHB4OyBib3JkZXItcmFkaXVzOiAycHhcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3Ryb25nIGNsYXNzPVwicGVwcGVybWludFwiPicgKyBwbGF5ZXIuYmlvLm5hbWUgKyAnPC9zdHJvbmc+PGJyPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgZHJpdmluZ0Rpc3RhbmNlICsgJyB5YXJkcycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgKHRlbmRlbmN5ID8gJywgJyArICh0ZW5kZW5jeSA9PT0gJ2xlZnQnID8gbGVmdFRlbmRlbmN5IDogKDEwMCAtIGxlZnRUZW5kZW5jeSkpICsgJyUgJyArIHRlbmRlbmN5ICsgJyB0ZW5kZW5jeScgOiAnJykgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxicj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdEcml2aW5nIGFjY3VyYWN5OiAnICsgZHJpdmluZ0FjY3VyYWN5ICsgJyU8YnI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnQ2x1YiBoZWFkIHNwZWVkOiAnICsgY2x1YkhlYWRTcGVlZCArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHN3aXRjaE1vZGU6IGZ1bmN0aW9uIChtb2RlKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgbW9kZTogbW9kZVxuICAgICAgICB9KTtcbiAgICB9XG5cbn0pO1xuXG52YXIgQWN0aW9uQnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQWN0aW9uQnV0dG9uJyxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2xhc3NTZXQgPSBSZWFjdC5hZGRvbnMuY2xhc3NTZXQoe1xuICAgICAgICAgICAgJ2hsaXN0X19pdGVtJzogdHJ1ZSxcbiAgICAgICAgICAgICd0b2dnbGUnOiB0cnVlLFxuICAgICAgICAgICAgJ2lzLXNlbGVjdGVkJzogdGhpcy5wcm9wcy5zZWxlY3RlZFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbih7XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBjbGFzc1NldCwgXG4gICAgICAgICAgICAgICAgb25DbGljazogIHRoaXMub25Ub2dnbGVDbGlja1xuICAgICAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmxhYmVsXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIG9uVG9nZ2xlQ2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNsaWNrKHRoaXMucHJvcHMubW9kZSk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcml2aW5nU3RhdHNWaWV3O1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBGbHV4ID0gRGVMb3JlYW4uRmx1eDtcbnZhciBEcml2aW5nU3RhdHNWaWV3ID0gcmVxdWlyZSgnLi9Ecml2aW5nU3RhdHNWaWV3LmpzeCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ2V4cG9ydHMnLFxuXG4gICAgbWl4aW5zOiBbRmx1eC5taXhpbnMuc3RvcmVMaXN0ZW5lcl0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRhdGEgPSB0aGlzLmdldFN0b3JlKCdwbGF5ZXJzJykucGxheWVycztcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgRHJpdmluZ1N0YXRzVmlldyh7ZGF0YTogZGF0YSB9KVxuICAgICAgICApO1xuICAgIH1cblxufSk7IiwiLypnbG9iYWwgZDMsXyAqL1xuXG52YXIgRGF0YUFzcGVjdCAgPSByZXF1aXJlKCcuL2FzcGVjdC9EYXRhQXNwZWN0Jyk7XG52YXIgQ3Jvc3NoYWlyICAgPSByZXF1aXJlKCcuL2VsZW1lbnQvQ3Jvc3NoYWlyJyk7XG52YXIgTWlkQXhpcyAgICAgPSByZXF1aXJlKCcuL2VsZW1lbnQvTWlkQXhpcycpO1xuXG52YXIgVFJBTlNJVElPTiA9ICdleHAnO1xudmFyIFRSQU5TSVRJT05fSU4gPSBUUkFOU0lUSU9OICsgJy1pbic7XG52YXIgVFJBTlNJVElPTl9PVVQgPSBUUkFOU0lUSU9OICsgJy1vdXQnO1xudmFyIFRSQU5TSVRJT05fSU5fT1VUID0gVFJBTlNJVElPTiArICctaW4tb3V0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjb25maWcpIHtcblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvL1xuICAgIC8vICBQcm9wZXJ0aWVzXG4gICAgLy9cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vICBDb25maWdcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgXG4gICAgdmFyIHdpZHRoICAgICAgID0gY29uZmlnLndpZHRoO1xuICAgIHZhciBoZWlnaHQgICAgICA9IGNvbmZpZy5oZWlnaHQ7XG4gICAgdmFyIHRpcExhYmVsICAgID0gY29uZmlnLnRpcExhYmVsO1xuICAgIFxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAgQXhlc1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIHZhciB4QXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgICAgLm9yaWVudCgnYm90dG9tJylcbiAgICAgICAgLmlubmVyVGlja1NpemUoMClcbiAgICAgICAgLm91dGVyVGlja1NpemUoMCk7XG4gICAgXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vICBFbGVtZW50c1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBcbiAgICB2YXIgJGVsID0gZDMuc2VsZWN0KGNvbmZpZy5lbClcbiAgICAgICAgLmFwcGVuZCgnc3ZnJylcbiAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfSk7XG4gICAgXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vICBDcm9zc2hhaXJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgXG4gICAgdmFyIGVsZW1lbnRPcHRzID0gXy5leHRlbmQoY29uZmlnLCB7XG4gICAgICAgIGVsOiAkZWwubm9kZSgpXG4gICAgfSk7XG4gICAgXG4gICAgdmFyIG1pZEF4aXMgPSBNaWRBeGlzKGVsZW1lbnRPcHRzKTtcbiAgICB2YXIgY3Jvc3NoYWlyID0gQ3Jvc3NoYWlyKGVsZW1lbnRPcHRzKTtcbiAgICBcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gIFRpcFxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIHZhciB0aXAgPSBkMy50aXAoKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnZDMtdGlwJylcbiAgICAgICAgLmh0bWwodGlwTGFiZWwpO1xuXG4gICAgJGVsLmNhbGwodGlwKTtcbiAgICBcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy9cbiAgICAvLyAgUmVuZGVyaW5nXG4gICAgLy9cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgXG4gICAgZnVuY3Rpb24gcmVuZGVyKGRhdGEsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IF8uZXh0ZW5kKHt9LCBjb25maWcsIG9wdGlvbnMpO1xuICAgICAgICBvcHRpb25zLmRhdGFBc3BlY3RzID0gXy5leHRlbmQoe30sIGNvbmZpZy5kYXRhQXNwZWN0cywgb3B0aW9ucy5kYXRhQXNwZWN0cyk7XG5cbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvLyAgQ29uZmlnXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgICAgICB2YXIgaWQgICAgICAgICAgPSBvcHRpb25zLmlkO1xuICAgICAgICB2YXIgZGF0YUFzcGVjdHMgPSBEYXRhQXNwZWN0LnZhbGlkYXRlKG9wdGlvbnMuZGF0YUFzcGVjdHMpO1xuICAgICAgICB2YXIgbWFyZ2luICAgICAgPSBvcHRpb25zLm1hcmdpbiB8fCAxMDtcbiAgICAgICAgdmFyIHNvcnQgICAgICAgID0gb3B0aW9ucy5zb3J0O1xuICAgICAgICBcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvLyAgRGF0YVxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIFxuICAgICAgICBfLmVhY2goZGF0YSwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgZC5hdHRyaWJ1dGVzID0ge307XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvLyAgU2NhbGVzXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgXG4gICAgICAgIF8uY2hhaW4oZGF0YUFzcGVjdHMpLmtleXMoKS5lYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgZGF0YUFzcGVjdHNba2V5XS51cGRhdGUoZGF0YSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciB4U2NhbGUgPSBkYXRhQXNwZWN0cy54LnNjYWxlKClcbiAgICAgICAgICAgIC5yYW5nZShbbWFyZ2luLCB3aWR0aCAtIG1hcmdpbl0pO1xuXG4gICAgICAgIHZhciB5U2NhbGUgPSBkYXRhQXNwZWN0cy55LnNjYWxlKClcbiAgICAgICAgICAgIC5yYW5nZShbbWFyZ2luLCBoZWlnaHQgLSBtYXJnaW5dKTtcbiAgICAgICAgXG4gICAgICAgIHhBeGlzLnNjYWxlKHhTY2FsZSk7XG4gICAgICAgIFxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vICBTZXR1cCBkYXRhXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgICAgICBkYXRhID0gX1xuICAgICAgICAgICAgLmNoYWluKGRhdGEpXG4gICAgICAgICAgICAuZWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICAgICAgXy5leHRlbmQoaXRlbSwgRGF0YUFzcGVjdC5nZXRBc3BlY3RWYWx1ZXMoZGF0YUFzcGVjdHMsIGl0ZW0pKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc29ydEJ5KGRhdGFBc3BlY3RzW3NvcnRdIHx8IGZ1bmN0aW9uKCkgeyByZXR1cm4gMCB9KVxuICAgICAgICAgICAgLnZhbHVlKCk7XG4gICAgICAgIFxuICAgICAgICB0aXAuZGlyZWN0aW9uKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHZhciB5ID0gaXRlbS55O1xuXG4gICAgICAgICAgICByZXR1cm4geSA8IDEwMCA/ICdzJyA6ICduJztcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vICBFbnRlclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIFxuICAgICAgICB2YXIgJCA9IHt9O1xuICAgICAgICBcbiAgICAgICAgJC5kYXRhID0gJGVsXG4gICAgICAgICAgICAuc2VsZWN0QWxsKCcuZG90JylcbiAgICAgICAgICAgIC5kYXRhKGRhdGEsIGlkKTtcblxuICAgICAgICAkLmVudGVyID0gJC5kYXRhLmVudGVyKCkuY2FsbChlbnRlcik7XG5cbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvLyAgRXhpdFxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIFxuICAgICAgICAkLmV4aXQgPSAkLmRhdGEuZXhpdCgpLmNhbGwoZXhpdCk7XG4gICAgICAgIFxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vICBVcGRhdGVcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBcbiAgICAgICAgJGVsLmNhbGwobWVyZ2UpO1xuICAgICAgICBcbiAgICAgICAgbWlkQXhpcy5yZW5kZXIoeEF4aXMpO1xuICAgICAgICBcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvLyAgRW50ZXJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgICAgIGZ1bmN0aW9uIGVudGVyKCkge1xuICAgICAgICAgICAgdmFyICQgPSB0aGlzLmFwcGVuZCgnZycpXG4gICAgICAgICAgICAgICAgLmNsYXNzZWQoJ2RvdCcsIHRydWUpXG4gICAgICAgICAgICAgICAgLmNsYXNzZWQoJ3J5ZGVyLWV1JywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZC5yeWRlckN1cCA9PT0gJ2V1JztcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jbGFzc2VkKCdyeWRlci11cycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQucnlkZXJDdXAgPT09ICd1cyc7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICQuY2FsbChjcmVhdGVIYWxvKTtcbiAgICAgICAgICAgICQuY2FsbChjcmVhdGVEb3QpO1xuXG4gICAgICAgICAgICAkLnNlbGVjdEFsbCgnY2lyY2xlJylcbiAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgIGN4OiBfLnByb3BlcnR5KCd4JyksXG4gICAgICAgICAgICAgICAgICAgIGN5OiB5U2NhbGUoMClcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdHlsZSh7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUhhbG8oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAgICAgICAgICAgLmNsYXNzZWQoJ2RvdF9faGFsbycsIHRydWUpXG4gICAgICAgICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgICAgICAgICByOiAyXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAub24oJ21vdXNlb3ZlcicsIG9uTW91c2VPdmVyKVxuICAgICAgICAgICAgICAgIC5vbignbW91c2VvdXQnLCBvbk1vdXNlT3V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZURvdCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgICAgICAgICAgICAuY2xhc3NlZCgnZG90X19jaXJjbGUnLCB0cnVlKVxuICAgICAgICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgcjogOFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN0eWxlKHtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vICBNZXJnZVxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIFxuICAgICAgICBmdW5jdGlvbiBtZXJnZSgpIHtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0QWxsKCcuZG90X19oYWxvJykuY2FsbChtZXJnZUhhbG8pO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RBbGwoJy5kb3RfX2NpcmNsZScpLmNhbGwobWVyZ2VEb3QpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmdW5jdGlvbiBtZXJnZUhhbG8oKSB7XG4gICAgICAgICAgICB0aGlzLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgICAgIC5lYXNlKFRSQU5TSVRJT05fT1VUKVxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbig2MDApXG4gICAgICAgICAgICAgICAgLmRlbGF5KGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQueCAqIDIuNSArIDIwMDtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgY3g6IF8ucHJvcGVydHkoJ3gnKSxcbiAgICAgICAgICAgICAgICAgICAgY3k6IF8ucHJvcGVydHkoJ3knKSxcbiAgICAgICAgICAgICAgICAgICAgcjogXy5wcm9wZXJ0eSgncicpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3R5bGUoe1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiBfLnByb3BlcnR5KCdhJylcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZnVuY3Rpb24gbWVyZ2VEb3QoKSB7XG4gICAgICAgICAgICB0aGlzLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgICAgIC5lYXNlKFRSQU5TSVRJT05fSU5fT1VUKVxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbig0MDApXG4gICAgICAgICAgICAgICAgLmRlbGF5KGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQueCAqIDIuNTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgY3g6IF8ucHJvcGVydHkoJ3gnKSxcbiAgICAgICAgICAgICAgICAgICAgY3k6IF8ucHJvcGVydHkoJ3knKSxcbiAgICAgICAgICAgICAgICAgICAgcjogMlxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN0eWxlKHtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vICBFeGl0XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgXG4gICAgICAgIGZ1bmN0aW9uIGV4aXQoKSB7XG4gICAgICAgICAgICB0aGlzLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbigzMDApXG4gICAgICAgICAgICAgICAgLnN0eWxlKHtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvL1xuICAgIC8vICBFdmVudCBoYW5kbGVyc1xuICAgIC8vXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgZnVuY3Rpb24gb25Nb3VzZU92ZXIocGxheWVyKSB7XG4gICAgICAgIHRpcC5zaG93KHBsYXllcik7XG4gICAgICAgIGNyb3NzaGFpci5zaG93KHBsYXllci54LCBwbGF5ZXIueSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25Nb3VzZU91dCgpIHtcbiAgICAgICAgdGlwLmhpZGUoKTtcbiAgICAgICAgY3Jvc3NoYWlyLmhpZGUoKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyOiByZW5kZXJcbiAgICB9O1xuICAgIFxufTtcbiIsIi8qZ2xvYmFsIGQzLF8qL1xuXG5mdW5jdGlvbiBEYXRhQXNwZWN0IChjb25maWcpIHtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgY29uZmlnID0geyB2YWx1ZTogY29uZmlnIH07XG4gICAgfVxuXG4gICAgdmFyIHZhbHVlID0gY29uZmlnLnZhbHVlO1xuICAgIHZhciBzY2FsZSA9IGNvbmZpZy5zY2FsZSB8fCBkMy5zY2FsZS5saW5lYXIoKTtcbiAgICB2YXIgbWluID0gY29uZmlnLm1pbiB8fCBkMy5taW47XG4gICAgdmFyIG1heCA9IGNvbmZpZy5tYXggfHwgZDMubWF4O1xuXG4gICAgZnVuY3Rpb24gZ2V0U2NhbGUgKCkge1xuICAgICAgICByZXR1cm4gc2NhbGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0VmFsdWUgKGQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlKGQpO1xuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBnZXRTY2FsZWRWYWx1ZSAoZCkge1xuICAgICAgICByZXR1cm4gc2NhbGUodmFsdWUoZCkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZSAoZGF0YSwgb3B0aW9ucykge1xuICAgICAgICBjb25maWcgPSBfLmV4dGVuZChjb25maWcsIG9wdGlvbnMpO1xuXG4gICAgICAgIHZhciBzY2FsZU1pbjtcbiAgICAgICAgdmFyIHNjYWxlTWF4ID0gbWF4KGRhdGEsIGdldFZhbHVlKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFRPRE86IEJldHRlciB3YXkgdG8gZG8gdGhpcyB3aXRoIHNjYWxlcz9cbiAgICAgICAgaWYgKCFtaW4gJiYgY29uZmlnLmFsaWduID09PSBEYXRhQXNwZWN0LkNFTlRSRSkge1xuICAgICAgICAgICAgc2NhbGVNaW4gPSAtc2NhbGVNYXg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY2FsZU1pbiA9IG1pbihkYXRhLCBnZXRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHNjYWxlLmRvbWFpbihbc2NhbGVNaW4sIHNjYWxlTWF4XSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF8uZXh0ZW5kKGdldFZhbHVlLCB7XG4gICAgICAgIHNjYWxlOiBnZXRTY2FsZSxcbiAgICAgICAgc2NhbGVkVmFsdWU6IGdldFNjYWxlZFZhbHVlLFxuICAgICAgICB1cGRhdGU6IHVwZGF0ZVxuICAgIH0pO1xufVxuXG5EYXRhQXNwZWN0LkNFTlRSRSA9ICdjZW50cmUnO1xuXG5EYXRhQXNwZWN0LnZhbGlkYXRlID0gZnVuY3Rpb24gKGRhdGFBc3BlY3RzKSB7XG4gICAgaWYgKGRhdGFBc3BlY3RzKSB7XG4gICAgICAgIF8uY2hhaW4oZGF0YUFzcGVjdHMpXG4gICAgICAgICAgICAua2V5cygpXG4gICAgICAgICAgICAuZWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShkYXRhQXNwZWN0c1trZXldIGluc3RhbmNlb2YgRGF0YUFzcGVjdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YUFzcGVjdHNba2V5XSA9IERhdGFBc3BlY3QoZGF0YUFzcGVjdHNba2V5XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBkYXRhQXNwZWN0cztcbn07XG5cbkRhdGFBc3BlY3QuZ2V0QXNwZWN0VmFsdWVzID0gZnVuY3Rpb24gKGRhdGFBc3BlY3RzLCBpdGVtKSB7XG4gICAgcmV0dXJuIF8ucmVkdWNlKF8ua2V5cyhkYXRhQXNwZWN0cyksIGZ1bmN0aW9uKHZhbHVlcywga2V5KSB7XG4gICAgICAgIHZhciBhc3BlY3QgPSBkYXRhQXNwZWN0c1trZXldO1xuICAgICAgICB2YWx1ZXNba2V5XSA9IGFzcGVjdC5zY2FsZWRWYWx1ZShpdGVtKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9LCB7fSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFBc3BlY3Q7IiwiLypnbG9iYWwgZDMqL1xuXG5mdW5jdGlvbiBDcm9zc2hhaXIoY29uZmlnKSB7XG4gICAgdmFyICRlbCA9IGQzLnNlbGVjdChjb25maWcuZWwpLmFwcGVuZCgnZycpXG4gICAgICAgIC5jbGFzc2VkKCdjcm9zc2hhaXInLCB0cnVlKVxuICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAwKTtcbiAgICBcbiAgICB2YXIgd2lkdGggPSBjb25maWcud2lkdGg7XG4gICAgdmFyIGhlaWdodCA9IGNvbmZpZy5oZWlnaHQ7XG5cbiAgICB2YXIgJGNyb3NzaGFpckxpbmVYID0gJGVsLmFwcGVuZCgnbGluZScpXG4gICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgIHgxOiAwLFxuICAgICAgICAgICAgeDI6IDAsXG4gICAgICAgICAgICB5MTogLWhlaWdodCxcbiAgICAgICAgICAgIHkyOiBoZWlnaHRcbiAgICAgICAgfSk7XG5cbiAgICB2YXIgJGNyb3NzaGFpckxpbmVZID0gJGVsLmFwcGVuZCgnbGluZScpXG4gICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgIHgxOiAtd2lkdGgsXG4gICAgICAgICAgICB4Mjogd2lkdGgsXG4gICAgICAgICAgICB5MTogMCxcbiAgICAgICAgICAgIHkyOiAwXG4gICAgICAgIH0pO1xuICAgIFxuICAgIGZ1bmN0aW9uIHNob3coeCwgeSkge1xuICAgICAgICAkZWxcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyB4ICsgJywnICsgeSArICcpJylcbiAgICAgICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIDEpO1xuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBoaWRlKCkge1xuICAgICAgICAkZWwuc3R5bGUoJ29wYWNpdHknLCAwKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2hvdzogc2hvdyxcbiAgICAgICAgaGlkZTogaGlkZVxuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ3Jvc3NoYWlyOyIsIi8qZ2xvYmFsIGQzICovXG5cbmZ1bmN0aW9uIE1pZEF4aXMoY29uZmlnKSB7XG4gICAgdmFyICRlbCA9IGQzLnNlbGVjdChjb25maWcuZWwpO1xuICAgIHZhciB3aWR0aCA9IGNvbmZpZy53aWR0aDtcbiAgICB2YXIgaGVpZ2h0ID0gY29uZmlnLmhlaWdodDtcbiAgICBcbiAgICB2YXIgJG1pZExpbmUgPSAkZWwuYXBwZW5kKCdsaW5lJylcbiAgICAgICAgLmNsYXNzZWQoJ2hhaXJsaW5lJywgdHJ1ZSlcbiAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgeDE6IDAsXG4gICAgICAgICAgICB4Mjogd2lkdGgsXG4gICAgICAgICAgICB5MTogaGVpZ2h0IC8gMixcbiAgICAgICAgICAgIHkyOiBoZWlnaHQgLyAyXG4gICAgICAgIH0pO1xuXG4gICAgdmFyICRheGlzID0gJGVsLmFwcGVuZCgnZycpXG4gICAgICAgIC5jbGFzc2VkKCdheGlzJywgdHJ1ZSlcbiAgICAgICAgLmNsYXNzZWQoJ2F4aXMtLXgnLCB0cnVlKTtcblxuICAgIGZ1bmN0aW9uIHJlbmRlcihheGlzKSB7XG4gICAgICAgICRheGlzXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCcgKyBNYXRoLnJvdW5kKGhlaWdodCAvIDIpICsgJyknKVxuICAgICAgICAgICAgLmNhbGwoYXhpcyk7XG5cbiAgICAgICAgJGF4aXNcbiAgICAgICAgICAgIC5zZWxlY3RBbGwoJy50aWNrIGxpbmUnKVxuICAgICAgICAgICAgLmF0dHIoJ3kxJywgLWhlaWdodCAqIDAuNSlcbiAgICAgICAgICAgIC5hdHRyKCd5MicsIGhlaWdodCAqIDAuNSk7XG5cbiAgICAgICAgJGF4aXNcbiAgICAgICAgICAgIC5zZWxlY3RBbGwoJ3RleHQnKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICdyb3RhdGUoLTkwKSB0cmFuc2xhdGUoJyArICgoaGVpZ2h0ICogMC41KSAtIDEwKSArICcsIC00MCknKVxuICAgICAgICAgICAgLnN0eWxlKCdmb250LXNpemUnLCAnMzBweCcpXG4gICAgICAgICAgICAuc3R5bGUoJ3RleHQtYW5jaG9yJywgJ2VuZCcpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuICRheGlzO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXI6IHJlbmRlclxuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWlkQXhpczsiLCJ2YXIgYXBwcyA9IHt9O1xuXG5mdW5jdGlvbiByZWdpc3RlciAobmFtZSwgbW9kdWxlKSB7XG4gICAgbW9kdWxlLm5hbWUgPSBuYW1lO1xuICAgIGFwcHNbbmFtZV0gPSBtb2R1bGU7XG59XG5cbmZ1bmN0aW9uIGdldCAobmFtZSkge1xuICAgIHJldHVybiBhcHBzW25hbWVdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICByZWdpc3RlcjogcmVnaXN0ZXIsXG4gICAgZ2V0OiBnZXRcbn07IiwiLypnbG9iYWwgZDMgKi9cblxudmFyIGNvbG91cnMgPSB7XG4gICAgbmF2eTogICAgICAgJyMxNjE5MWUnLFxuICAgIGNvbnRyYXN0OiAgICcjZmZmJyxcbiAgICBjaHJvbWU6ICAgICAnI2VkZWNmMScsXG4gICAgbGVtb246ICAgICAgJyNmMWU0MDAnLFxuICAgIHBlYXI6ICAgICAgICcjYzhkMzAwJyxcbiAgICBzcGVhcm1pbnQ6ICAnIzdkY2FkMycsXG4gICAgcGVwcGVybWludDogJyMzYmI4YmInXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBcbiAgICBwYWxldHRlOiB7XG4gICAgICAgIGNvbG91cnM6IGNvbG91cnMsXG4gICAgICAgIHNjYWxlOiBbXG4gICAgICAgICAgICBjb2xvdXJzLmxlbW9uLFxuICAgICAgICAgICAgY29sb3Vycy5wZWFyLFxuICAgICAgICAgICAgY29sb3Vycy5zcGVhcm1pbnQsXG4gICAgICAgICAgICBjb2xvdXJzLnBlcHBlcm1pbnQsXG4gICAgICAgICAgICBjb2xvdXJzLmNvbnRyYXN0LFxuICAgICAgICAgICAgY29sb3Vycy5jaHJvbWVcbiAgICAgICAgXVxuICAgIH1cbiAgICBcbn07IiwidmFyIEFwcGxpY2F0aW9uVmlldyA9IHJlcXVpcmUoJy4vdmlldy9BcHBsaWNhdGlvblZpZXcuanN4Jyk7XG5cbnZhciBBcHBSZWdpc3RyeSA9IHJlcXVpcmUoJy4vYXBwL0FwcFJlZ2lzdHJ5Jyk7XG5BcHBSZWdpc3RyeS5yZWdpc3RlcigncGdhdG91cicsIHJlcXVpcmUoJy4uLy4uL2FwcHMvcGdhdG91ci9zcmMvc2NyaXB0cycpKTtcblxudmFyIGFwcFZpZXcgPSBSZWFjdC5yZW5kZXJDb21wb25lbnQoQXBwbGljYXRpb25WaWV3KCksIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdnbG9iYWwnKSk7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBIZWFkZXIgICAgICAgICAgPSByZXF1aXJlKCcuL2NvbXBvbmVudC9IZWFkZXIuanN4Jyk7XG52YXIgU2Nyb2xsSGFuZGxlciAgID0gcmVxdWlyZSgnLi9oZWxwZXIvU2Nyb2xsSGFuZGxlcicpO1xudmFyIEFwcFJlZ2lzdHJ5ICAgICA9IHJlcXVpcmUoJy4uL2FwcC9BcHBSZWdpc3RyeScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvL1xuICAgIC8vICBQcm9wZXJ0aWVzXG4gICAgLy9cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBkaXNwbGF5TmFtZTogJ0FwcGxpY2F0aW9uVmlldycsXG5cbiAgICBtaXhpbnM6IFtdLFxuXG4gICAgc3RhdGljczoge30sXG5cbiAgICBwcm9wVHlwZXM6IHt9LFxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vXG4gICAgLy8gIERlZmF1bHRzXG4gICAgLy9cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGN1cnJlbnRBcHA6ICdwZ2F0b3VyJ1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvL1xuICAgIC8vICBMaWZlY3ljbGVcbiAgICAvL1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAgTW91bnRpbmdcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxIYW5kbGVyID0gU2Nyb2xsSGFuZGxlcih7XG4gICAgICAgICAgICBvblNjcm9sbDogdGhpcy5vblNjcm9sbCxcbiAgICAgICAgICAgIG9uUmVzaXplOiB0aGlzLm9uUmVzaXplXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnNjcm9sbEhhbmRsZXIuaW5pdCgpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudERpZFVwZGF0ZSgpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIH0sXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gIFByb3BzXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKHByb3BzKSB7XG4gICAgfSxcblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAgVXBkYXRlXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgY29tcG9uZW50V2lsbFVwZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFwcE5hbWUgPSB0aGlzLnN0YXRlLmN1cnJlbnRBcHA7XG5cbiAgICAgICAgaWYgKCF0aGlzLmFwcCB8fCB0aGlzLmFwcE5hbWUgIT09IGFwcE5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMubG9hZEFwcChhcHBOYW1lKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy9cbiAgICAvLyAgUmVuZGVyaW5nXG4gICAgLy9cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXG4gICAgICAgICAgICAgICAgSGVhZGVyKHtzY3JvbGxZOiAgdGhpcy5zdGF0ZS5zY3JvbGxZLCBkb2N1bWVudEhlaWdodDogIGRvY3VtZW50LmJvZHkub2Zmc2V0SGVpZ2h0fSksIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe3JlZjogXCJhcHBDb250YWluZXJcIiwgY2xhc3NOYW1lOiBcImFwcGNvbnRhaW5lclwifSwgXG4gICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcFxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgbG9hZEFwcDogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRBcHBOYW1lID0gdGhpcy5zdGF0ZS5jdXJyZW50QXBwO1xuXG4gICAgICAgIGlmIChuYW1lICE9PSBjdXJyZW50QXBwTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGN1cnJlbnRBcHA6IG5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFwcCA9IEFwcFJlZ2lzdHJ5LmdldChjdXJyZW50QXBwTmFtZSk7XG4gICAgICAgIHRoaXMuYXBwID0gYXBwKCk7XG4gICAgICAgIHRoaXMuYXBwTmFtZSA9IG5hbWU7XG5cbiAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgIH0sXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy9cbiAgICAvLyAgRXZlbnQgaGFuZGxpbmdcbiAgICAvL1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIG9uU2Nyb2xsOiBmdW5jdGlvbiAoc2Nyb2xsWSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgc2Nyb2xsWTogc2Nyb2xsWSB9KTtcbiAgICB9LFxuXG4gICAgb25SZXNpemU6IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH0pO1xuICAgIH1cblxufSk7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBjb25maWcgPSByZXF1aXJlKCcuLi8uLi9jb25maWcnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgXG4gICAgZGlzcGxheU5hbWU6ICdIZWFkZXInLFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzY3JvbGxZOiAwLFxuICAgICAgICAgICAgZG9jdW1lbnRIZWlnaHQ6IDBcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb2xvdXJTY2FsZTogZDMuc2NhbGUubGluZWFyKCkucmFuZ2UoY29uZmlnLnBhbGV0dGUuc2NhbGUpXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHVwZGF0ZUNvbG91clNjYWxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzY2FsZSAgID0gdGhpcy5zdGF0ZS5jb2xvdXJTY2FsZTtcbiAgICAgICAgdmFyIHMgICAgICAgPSBbXTtcbiAgICAgICAgdmFyIGxlbiAgICAgPSBzY2FsZS5yYW5nZSgpLmxlbmd0aDtcbiAgICAgICAgdmFyIGggICAgICAgPSB0aGlzLnByb3BzLmRvY3VtZW50SGVpZ2h0O1xuICAgICAgICB2YXIgaW5jICAgICA9IGggLyBsZW47XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgcy5wdXNoKGkgKiBpbmMpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2NhbGUuZG9tYWluKHMpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvdXJTY2FsZSgpO1xuXG4gICAgICAgIHZhciBhY2NlbnQgPSB0aGlzLnN0YXRlLmNvbG91clNjYWxlKHRoaXMucHJvcHMuc2Nyb2xsWSk7XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIFJlYWN0LkRPTS5oZWFkZXIoe2NsYXNzTmFtZTogXCJoZWFkZXJcIn0sIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2lkOiBcImhlYWRlci1sb2dvXCIsIGNsYXNzTmFtZTogXCJoZWFkZXJfX2xvZ29cIiwgc3R5bGU6IHsgJ2JvcmRlci1jb2xvcic6IGFjY2VudH19LCBcbiAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyTG9nbyhhY2NlbnQpIFxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyTG9nbzogZnVuY3Rpb24gKGFjY2VudCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgUmVhY3QuRE9NLnN2Zyh7eG1sbnM6IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgd2lkdGg6IFwiMzRcIiwgaGVpZ2h0OiBcIjI5MFwifSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnJlY3Qoe3g6IFwiMFwiLCB5OiBcIjI0Ny4yXCIsIHN0eWxlOiB7IGZpbGw6IGFjY2VudH0sIHdpZHRoOiBcIjMzLjJcIiwgaGVpZ2h0OiBcIjEuNlwifSksIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5wYXRoKHtzdHlsZTogeyBmaWxsOiBhY2NlbnR9LCBkOiBcIk0uOSAyNDEuOGMtLjYgMC0xLS40LTEtMSAwLS4zLjEtLjYuNC0uOGwzMC43LTMxaC0zMC44di0xLjZoMzIuMmMuNiAwIDEgLjQgMSAxIDAgLjMtLjEuNi0uNC44bC0zMC43IDMxaDMxLjF2MS42aC0zMi41elwifSksIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5yZWN0KHt4OiBcIjBcIiwgeTogXCI3OS4yXCIsIGZpbGw6IFwiIzNDQjdCQVwiLCB3aWR0aDogXCIzMy4yXCIsIGhlaWdodDogXCIxLjZcIn0pLCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00ucGF0aCh7ZmlsbDogXCIjRURFQkYxXCIsIGQ6IFwiTTE5LjIgNzQuN3YtMjMuNGMwLTEuOC0uMi0zLjUtLjUtNS0uNC0xLjUtLjktMi43LTEuNi0zLjgtLjctMS0xLjYtMS45LTIuNi0yLjRzLTIuMy0uOS0zLjgtLjljLTEuNCAwLTIuNy4zLTMuOC45LTEuMS42LTIgMS40LTIuOCAyLjQtLjcgMS4xLTEuMyAyLjMtMS43IDMuOC0uNCAxLjUtLjYgMy4xLS42IDQuOXYyMy40aC0xLjZ2LTIzLjNjMC0yIC4yLTMuOC42LTUuNC40LTEuNyAxLjEtMy4xIDItNC4zLjktMS4yIDItMi4yIDMuMy0yLjkgMS4zLS43IDIuOC0xIDQuNi0xIDEuNyAwIDMuMi4zIDQuNSAxIDEuMy43IDIuMyAxLjYgMy4yIDIuOS44IDEuMiAxLjQgMi43IDEuOCA0LjMuNCAxLjYuNiAzLjUuNiA1LjR2MjEuOGgxMi43djEuNmgtMTQuM3pcIn0pLCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00ucmVjdCh7eDogXCIzMS43XCIsIHN0eWxlOiB7IGZpbGw6IGFjY2VudH0sIHdpZHRoOiBcIjEuNlwiLCBoZWlnaHQ6IFwiMzQuNFwifSksIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5yZWN0KHt4OiBcIjBcIiwgZmlsbDogXCIjRURFQkYxXCIsIHdpZHRoOiBcIjEuNlwiLCBoZWlnaHQ6IFwiMzQuNFwifSksIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5yZWN0KHt4OiBcIjE1LjVcIiwgZmlsbDogXCIjRURFQkYxXCIsIHdpZHRoOiBcIjEuNlwiLCBoZWlnaHQ6IFwiMzQuNFwifSksIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5wYXRoKHtzdHlsZTogeyBmaWxsOiBhY2NlbnR9LCBkOiBcIk0xOS4yIDI5MC4zdi0yMy40YzAtMS44LS4yLTMuNS0uNS01LS40LTEuNS0uOS0yLjctMS42LTMuOC0uNy0xLTEuNi0xLjktMi42LTIuNC0xLjEtLjYtMi4zLS45LTMuOC0uOS0xLjQgMC0yLjcuMy0zLjguOS0xLjEuNi0yIDEuNC0yLjggMi40LS43IDEuMS0xLjMgMi4zLTEuNyAzLjgtLjQgMS41LS42IDMuMS0uNiA0Ljl2MjMuNGgtMS42di0yMy40YzAtMiAuMi0zLjguNi01LjQuNC0xLjcgMS4xLTMuMSAyLTQuMy45LTEuMiAyLTIuMiAzLjMtMi45IDEuMy0uNyAyLjgtMSA0LjYtMSAxLjcgMCAzLjIuMyA0LjUgMSAxLjMuNyAyLjMgMS42IDMuMiAyLjkuOCAxLjIgMS40IDIuNyAxLjggNC4zLjQgMS42LjYgMy41LjYgNS40djIxLjhoMTIuN3YxLjZoLTE0LjN6XCJ9KSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnBhdGgoe2ZpbGw6IFwiIzdFQzlEM1wiLCBkOiBcIk0zMS45IDIwMy4xdi0yNS4xYzAtMy43LS42LTYuNS0xLjgtOC4yLTEuMS0xLjctMy0yLjUtNS42LTIuNS0yLjYgMC00LjMuOC01LjMgMi41LTEuMSAxLjgtMS42IDQuNS0xLjYgOC4ydjEyLjhjMCA0LS42IDcuMS0xLjkgOS4xLTEuMyAyLjEtMy41IDMuMi02LjYgMy4yLTMuMSAwLTUuNC0xLjEtNi44LTMuMS0xLjQtMi0yLjEtNS4xLTIuMS05LjJ2LTg5LjNjMC0yIC4yLTMuOC42LTUuNC40LTEuNyAxLjEtMy4xIDItNC4zLjktMS4yIDItMi4yIDMuMy0yLjkgMS4zLS43IDIuOC0xIDQuNi0xIDEuNyAwIDMuMi4zIDQuNSAxIDEuMy43IDIuMyAxLjYgMy4yIDIuOS44IDEuMiAxLjQgMi43IDEuOCA0LjMuMyAxLjIuNCAyLjUuNSAzLjhsMTIuOC0xNS45djIuNmwtMTIuNyAxNS44djIwLjloMTIuN3YxLjZoLTE0LjN2LTIzLjRjMC0xLjgtLjItMy41LS41LTUtLjQtMS41LS45LTIuNy0xLjYtMy44LS43LTEtMS42LTEuOS0yLjYtMi40LTEuMS0uNi0yLjMtLjktMy44LS45LTEuNCAwLTIuNy4zLTMuOC45LTEuMS42LTIgMS40LTIuOCAyLjQtLjcgMS4xLTEuMyAyLjMtMS43IDMuOC0uNCAxLjUtLjYgMy4xLS42IDQuOXY0My43aDMxLjd2MS42aC0zMS43djQ0YzAgMy43LjYgNi41IDEuOCA4LjIgMS4xIDEuNyAzIDIuNSA1LjYgMi41IDIuNiAwIDQuMy0uOCA1LjMtMi41IDEtMS44IDEuNi00LjUgMS42LTguMnYtMTIuN2MwLTQgLjYtNy4xIDEuOS05LjEgMS4zLTIuMSAzLjUtMy4yIDYuNi0zLjIgMy4xIDAgNS40IDEuMSA2LjggMy4xIDEuNCAyIDIuMSA1LjEgMi4xIDkuMnYyNS4yaC0xLjZ6XCJ9KVxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuICAgIH1cbiAgICBcbn0pOyIsImZ1bmN0aW9uIFNjcm9sbEhhbmRsZXIoY29uZmlnKSB7XG4gICAgdmFyIHNjcm9sbFRpY2tlcjtcbiAgICB2YXIgcmVzaXplVGlja2VyO1xuXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgc2Nyb2xsVGlja2VyID0gdGlja2VyKHtcbiAgICAgICAgICAgIHZhbHVlOiB3aW5kb3dTY3JvbGwsXG4gICAgICAgICAgICBoYW5kbGVyOiBjb25maWcub25TY3JvbGxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVzaXplVGlja2VyID0gdGlja2VyKHtcbiAgICAgICAgICAgIHZhbHVlOiB3aW5kb3dTaXplLFxuICAgICAgICAgICAgaGFuZGxlcjogY29uZmlnLm9uUmVzaXplLFxuICAgICAgICAgICAgbWF0Y2hlcjogZnVuY3Rpb24oY3VyclNpemUsIGxhc3RTaXplKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChsYXN0U2l6ZS53aWR0aCA9PT0gY3VyclNpemUud2lkdGgpICYmIChsYXN0U2l6ZS5oZWlnaHQgPT09IGN1cnJTaXplLmhlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGQzLnNlbGVjdCh3aW5kb3cpXG4gICAgICAgICAgICAub24oJ3Njcm9sbCcsIHNjcm9sbFRpY2tlci5kZWZlcilcbiAgICAgICAgICAgIC5vbigncmVzaXplJywgcmVzaXplVGlja2VyLmRlZmVyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0aWNrZXIob3B0aW9ucykge1xuICAgICAgICB2YXIgY3VycmVudCA9IG9wdGlvbnMudmFsdWUoKSxcbiAgICAgICAgICAgIG1hdGNoZXIgPSBvcHRpb25zLm1hdGNoZXIgfHwgZGVmYXVsdE1hdGNoZXIsXG4gICAgICAgICAgICBsYXN0LFxuICAgICAgICAgICAgdGlja2luZztcblxuICAgICAgICBmdW5jdGlvbiB0aWNrKCkge1xuICAgICAgICAgICAgaWYgKCFtYXRjaGVyKGN1cnJlbnQsIGxhc3QpKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGxhc3Q7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5oYW5kbGVyKGN1cnJlbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aWNraW5nID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkZWZlcigpIHtcbiAgICAgICAgICAgIGxhc3QgPSBvcHRpb25zLnZhbHVlKCk7XG5cbiAgICAgICAgICAgIGlmICghdGlja2luZykge1xuICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgICAgICAgICAgICAgICB0aWNraW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRlZmF1bHRNYXRjaGVyKGN1cnJlbnQsIGxhc3QpIHtcbiAgICAgICAgICAgIHJldHVybiAoY3VycmVudCA9PT0gbGFzdCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZGVmZXI6IGRlZmVyXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2luZG93U2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2luZG93U2Nyb2xsKCkge1xuICAgICAgICByZXR1cm4gd2luZG93LnNjcm9sbFkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBpbml0OiBpbml0XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTY3JvbGxIYW5kbGVyOyJdfQ==
