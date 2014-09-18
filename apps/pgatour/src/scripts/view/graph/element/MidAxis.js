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