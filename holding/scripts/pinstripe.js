(function () {
    'use strict';
    
    var data = {
        'peppermint': [
            'Morgan Stanley', 'UBS Investment Bank', 'Ford', 'Land Rover', 'Wunderman', 'Xerox', 'Canon', 'De Beers',
            'Quark', 'Tussauds Group', 'Alcatel Lucent', 'Vodafone', 'Orange', 'BBC', 'Adobe Consulting', 'Sony Ericsson', 'Nokia'
        ],
        'contrast': [
            'JavaScript', 'ActionScript', 'HTML5', 'CSS', 'SASS', 'Stylus', 'Node JS', 'Flex'
        ],
        'spearmint': [
            'React', 'Flux', 'Backbone', 'Lodash', 'jQuery', 'Zepto', 'D3', 'Express', 'Parsley',
            'Karma', 'Jasmine', 'Mocha', 'Chai', 'Sinon',
            'Grunt', 'Webpack', 'Browserify', 'Git'
        ],
        'pear': [
            'Data Visualisation', 'Software Engineering', 'User Experience', 'User Experience Development', 'UI Choreography', 'Prototyping'
        ],
        'lemon': [
            'Agile', 'SCRUM', 'LEAN', 'TDD', 'BDD'
        ],
        'chrome': [
            'Twyford', 'London'
        ]
    };
    
    var currentIndex = 0;
    
    var categories = _(data)
        .keys()
        .map(function (key) {
            return {
                key: key,
                index: 0,
                len: data[key].length,
                items: data[key]
            };
        }, {})
        .value();
    
    var categoryIndex = _.indexBy(categories, _.property('key'));
    
    var allItems = _(data)
        .keys()
        .map(function (key) {
            var category = categoryIndex[key];
        
            return _.map(data[key], function (item) {
                return {
                    category: category,
                    label: item
                };
            });
        })
        .flatten()
        .shuffle()
        .value();
    
    function layoutHex () {
        var $container = $('#hex');
        var isMeasuringItem = true;
        var itemWidth;
        var itemHeight;
        var width = window.innerWidth * 1.5;
        var height = window.innerHeight * 1.5;
        var gap = 8;
        var row = 0;
        var x = 0;
        var y = 0;
        var centreBias;
        var visibilityBias = 0.4;

        while (y < height) {
            x = (row % 2 === 1) ? ((itemWidth + gap) / 2) : 0;

            while (x < width) {
                centreBias = 1 - (Math.abs((x / width) - 0.5) * 2);

                if (isMeasuringItem || Math.random() > visibilityBias) {
                    var $el = createHex()
                        .css({
                            left: x,
                            opacity: 0,
                            top: y
                        })
                        .appendTo($container);
                    
                    setTimeout(function (opacity) {
                        this.css({
                            opacity: opacity
                        });
                    }.bind($el, [Math.max(0.1, Math.random()) * centreBias]), Math.random() * 5000);
                    
                    if (isMeasuringItem) {
                        itemWidth = $el.width();
                        itemHeight = $el.height();

                        isMeasuringItem = false;
                    }
                }

                x += itemWidth + gap;
            }

            y += itemHeight * 0.7;
            row++;
        }
        
        $container.css({
            'transform': 'rotate(-45deg) translate(-' + (width / 2) + 'px, 370px)'
        });
    }
    
    function createHex () {
        var item = nextItem();
        
        var $el = $('<div class="hex__item"></div>');
        
        var $svg = $('<svg class="hex__graphic" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="#HexSq" class="stroke--' + item.category.key + ' fill--' + item.category.key + '" /></svg>')
            .appendTo($el);
        
        var $label = $('<span class="hex__label ' + item.category.key + '">' + item.label + '</span>')
            .appendTo($el);
        
        return $el;
    }
    
    function nextItem () {
        currentIndex++;
        
        if (currentIndex === allItems.length) {
            currentIndex = 0;
        }
        
        return allItems[currentIndex];
    }
    
    layoutHex();
    
})();