/*global d3 */

var colours = {
    navy:       '#16191e',
    contrast:   '#fff',
    chrome:     '#edecf1',
    lemon:      '#f1e400',
    pear:       '#c8d300',
    spearmint:  '#7dcad3',
    peppermint: '#3bb8bb'
};

module.exports = {
    
    palette: {
        colours: colours,
        scale: [
            colours.lemon,
            colours.pear,
            colours.spearmint,
            colours.peppermint,
            colours.contrast,
            colours.chrome
        ]
    }
    
};