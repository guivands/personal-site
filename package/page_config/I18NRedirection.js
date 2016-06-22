var http = require('http');
var i18n = require('../i18n/lang');

function I18NRedirection(config) {
    this.configurations = [];
    if (config && config.path)
        this.addConfig(config);
    else
        this.configurations = config;
}

I18NRedirection.prototype.addConfig = function(config) {
    if (!config)
        throw new Error('Configuração de Redirection faltando');
    
    this.configurations.push(config);
}

I18NRedirection.prototype.redirect = function (req, res) {
    if (req.path == '/') {
        var status = 303;
        var url = '/pt/';
        res.status(status);
        res.setHeader("Location", url);
        var body;
        if (req.accepts('html')) {
            body = '<p>' + http.STATUS_CODES[status] + '. Redirecionando para <a href="' + url + '">' + url + '</a></p>';
            res.header('Content-Type', 'text/html');
        } else {
            body = http.STATUS_CODES[status] + '. Redirecting to ' + url;
            res.header('Content-Type', 'text/plain');
        }
        return res.end(body);
    }
    
    var relativePath = req.path.replace(/\/[a-z]{2}(\/.*)/, '$1');
    console.log(relativePath);
    res.send('OK');
}

module.exports = I18NRedirection;
