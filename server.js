//dependencias do projeto
var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var ejs = require('ejs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');


//dependencias internas
//acesso ao BD
require('./package/db/pool');
//configuracao de paginas
var pages = require('./pages');
//internacionalizacao
var i18n = require('./package/i18n/lang');


//configuracao do expressa e EJS
var app = express();

app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.use('/client', express.static('client'));
app.use( cookieParser() );
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


// adicionando variavel de internacionalizacao dentro da requisicao para ser utilizado pelos fluxos
app.use(function(req, res, next) {
	try {
		res.g2messages = res.locals.g2messages = i18n.resolve(req.path);
	} catch (err) {
		console.log(err);
		return res.render('500');
	}
	next();
});

// funcao render utilizando a templatizacao do site
app.use(function(req, res, next) {
	if (res) {
		res.g2render = function(page, params) {
			var g2params = {};
			g2params.page = '../' + page;
			g2params.params = params;
			res.render('template/template', g2params);
		}
	}
	next();
});

require('./passport.js')(app, passport, LocalStrategy);

//criando pool de conexões e configurando as páginas do site
pages.config(app, g2pool);

//iniciando serviço
var server = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Servidor iniciado em", addr.address + ":" + addr.port);
});
