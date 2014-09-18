var cheerio = require('cheerio');
var _ = require('lodash');

function map($, fn) {
    var items = [];
    
    $.each(function(index) {
        var value = fn.call(this, cheerio(this), index);
        items.push(value);
    });
    
    return items;
}

function parseTableRow($, headers, idFn) {
    var $cells = $.find('td');
    var cells = map($cells, text);
    
    if (cells.length < headers.length) {
        return undefined;
    }
    
    var data = cells.reduce(function(data, cell, i) {
        data[headers[i]] = cell;
        return data;
    }, {});
    
    if (typeof idFn === 'function') {
        data.id = idFn($);
    }
    
    return data;
}

function parseTable($, idFn) {
    var $headers = $.find('thead tr:first-child td');
    var $rows = $.find('tbody tr');
    var headers = map($headers, text);
    
    return map($rows, function($row) {
        return parseTableRow($row, headers, idFn);
    }).filter(_.identity);
}

function text($) {
    return $.text().trim();
}

module.exports = {
    map: map,
    parseTable: parseTable
};