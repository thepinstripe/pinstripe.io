var _ = require('lodash');

function wrapResponse(res, process) {
    return function(err, data) {
        if (err) return res.status(404).end();

        if (_.isFunction(process)) {
            data = process(data);
        }

        res.send(data);
    };
}

module.exports = {
    wrapResponse: wrapResponse
};