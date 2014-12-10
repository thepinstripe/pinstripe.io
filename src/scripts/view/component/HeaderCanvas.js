/*global d3,TweenMax,Expo */

var DataJoin    = require('datajoin');
var color       = require('color');
var config      = require('../../config');

var itemGap = 1;
var itemWidth = 5;
var height = 30;

module.exports = function (options) {
    var el = options.el;
    var ctx = el.getContext('2d');
    var scale = d3.scale.linear()
        .range(config.palette.scale);
    var rendered = false;

    var dj = DataJoin()
        .factory(function (data) {
            return {
                x: data.x,
                width: 0,
                height: 0,
                opacity: 0,
                data: data
            };
        });
    
    function render () {
        var width = window.innerWidth;
        
        el.width = width;
        el.height = window.innerHeight;
        
        var s = [];
        var inc = width / config.palette.scale.length;
        var items = [];
        
        for (var i = 0; i < config.palette.scale.length; i++) {
            s.push(i * inc);
        }
        
        scale.domain(s);
        
        var x = 0;
        
        while (x < 2000) {
            var colour = color(scale(x)).rgbArray().join(','); //config.palette.scale[c % config.palette.scale.length];
            
            for (var i = 0; i < 3; i++) {
                var w = Math.round(itemWidth * Math.random());
                var h = Math.round(i * height * Math.random());
                
                items.push({
                    x: x,
                    opacity: Math.random() * 0.5,
                    colour: colour,
                    width: w,
                    height: h
                });
            }

            x += w + itemGap;
        }

        dj.data(items, function (d, i) { return i; });
        
        dj.all().forEach(function (item, i, arr) {
            TweenMax.to(item, 1 + Math.random() * 3, _.extend({
                delay: i * 0.001,
                ease: Expo.easeInOut
            }, _.pick(item.data, ['opacity', 'width', 'height'])));
        });

        dj.exit().forEach(function (item, i, arr) {
            TweenMax.to(item, 0.5, {
                height: 0,
                opacity: 0,
                ease: Expo.easeInOut
            });
        });
        
        if (!rendered) {
            rendered = true;
            draw();
        }
    }
    
    function draw () {
        ctx.clearRect(0, 0, el.width, el.height);
        
        dj.all().concat(dj.exit()).forEach(function (item) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'rgba(' + item.data.colour + ',' + item.opacity + ')';
            ctx.fillRect(item.x, 0, item.width, item.height);
        });
        
        requestAnimationFrame(draw);
    }
    
    return {
        render: render
    };
};