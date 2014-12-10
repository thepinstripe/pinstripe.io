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