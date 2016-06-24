var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var ejs = require('ejs');


//acesso ao BD
var db = require('./package/db/pool');
var pages = require('./pages');
var i18n = require('./package/i18n/lang');


var app = express();

app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.use('/client', express.static('client'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// adicionando variavel de internacionalizacao dentro da requisicao para ser utilizado pelos fluxos
app.use(function(req, res, next) {
	try {
		res.g2messages = res.locals.g2messages = i18n.resolve(req.path);
	} catch (err) {
		console.log(err);
		res.render('500');
	}
	next();
});

var pool = db.createPool();
pages.config(app, pool);


var server = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Servidor iniciado em", addr.address + ":" + addr.port);
});