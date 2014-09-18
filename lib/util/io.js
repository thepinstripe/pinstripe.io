var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var wrench = require('wrench');

function loadJSON(file) {
    var data = readFile(file);
    return data ? JSON.parse(data) : undefined;
}

function loadJSONAsync(file, done) {
    fs.readFile(file, function(err, data) {
        if (err) {
            return done(err);
        }
        
        done(null, JSON.parse(String(file)));
    });
}

function saveJSON(file, obj) {
    writeFile(file, JSON.stringify(obj, null, '  '));
}

function loadJSONDir(dir, filter) {
    return fs.readdirSync(dir)
        .filter(isJSONFile)
        .filter(filter || _.identity)
        .map(function (file) {
            return loadJSON(path.join(dir, file));
        });
}

function loadJSONDirAsObject(dir, filter) {
    return fs.readdirSync(dir)
        .filter(isJSONFile)
        .filter(filter || _.identity)
        .reduce(function (data, file) {
            var ext = path.extname(file);
            data[path.basename(file, ext)] = loadJSON(path.join(dir, file));
            return data;
        }, {});
}

function loadCSV(file) {
    var lines = readLines(readFile(file));
    var headers = lines.shift().split(',').map(function(d) { return d.trim() });

    return lines
        .map(function(line) {
            return line.split(',');
        })
        .map(function(row) {
            return headers.reduce(function(data, header, i) {
                data[header] = row[i].trim();
                return data;
            }, {});
        });
}

function readLines(raw) {
    return raw
        .split('\n')
        .map(function(line) {
            return line.trim();
        })
        .filter(function(line) {
            return line.length > 0;
        });
}

function loadNotes(file) {
    var lines = readLines(readFile(file));
    var data = {};
    var config;

    lines.forEach(function(line) {
        if (line.charAt(0) === '|') {
            config = line.substr(1).trim();
            data[config] = {};
        } else {
            var parts = line.split('=').map(function(d) { return d.trim() });
            var key = parts[0];
            var value = parts[1];

            (config ? data[config] : data)[key] = value;
        }
    });

    return data;
}

function readFile(file) {
    return fs.existsSync(file) ? String(fs.readFileSync(file)) : undefined;
}

function writeFile(file, data) {
    var dir = path.dirname(file);
    wrench.mkdirSyncRecursive(dir);
    fs.writeFileSync(file, data);
}

function isJSONFile(file) {
    return path.extname(file) === '.json';
}

module.exports = {
    loadJSON: loadJSON,
    loadJSONAsync: loadJSONAsync,
    loadJSONDir: loadJSONDir,
    loadJSONDirAsObject: loadJSONDirAsObject,
    saveJSON: saveJSON,
    loadCSV: loadCSV,
    loadNotes: loadNotes,
    readFile: readFile,
    writeFile: writeFile
};