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