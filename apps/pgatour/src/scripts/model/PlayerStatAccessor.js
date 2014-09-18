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
