var _ = require('lodash');

function mapKeys(data, keyMappings) {
    if (_.isUndefined(keyMappings)) {
        keyMappings = data;
        
        return function(d) {
            return mapKeys(d, keyMappings);
        };
    }
    
    return Object.keys(keyMappings).reduce(function(newData, key) {
        var mapping = keyMappings[key];
        newData[mapping] = data[key];
        return newData;
    }, {});
}

function renameProperty(o, oldProp, newProp) {
    o[newProp] = o[oldProp];
    delete o[oldProp];
    
    return o;
}

module.exports = {
    mapKeys: mapKeys,
    renameProperty: renameProperty
};