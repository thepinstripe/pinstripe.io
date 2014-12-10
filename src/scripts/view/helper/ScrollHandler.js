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