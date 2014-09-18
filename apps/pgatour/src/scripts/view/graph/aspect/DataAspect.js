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