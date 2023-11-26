const path = require('path');

module.exports = {
    mode: 'development',  // or 'production'

    entry: './static/js/index.js',

    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, './static/js'),  // Output directory
    }
};
