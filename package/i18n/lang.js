module.exports.resolve = function(path, module) {
    if (!module)
        module = 'messages';
    
    var lang = path.replace(/\/([a-z]{2}).*/,'$1');
    try {
        return require('./' + module + '.' + lang);
    } catch(err) {
        if (err.code == 'MODULE_NOT_FOUND') {
            return require('./' + module + '.pt');
        }
        throw err;
    }
}