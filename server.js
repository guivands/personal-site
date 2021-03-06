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
var winston = require('winston');

global.logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({level:'debug'}),
		new (winston.transports.File)({ filename: '../guilhermegom.es.log', level:'debug'})
	]
});

var fs = require('fs');
var multer = require('multer');
var storage = multer.diskStorage({
	destination: function(req, file, callback) {
		var dir = './client/up/post/' + req.body.id +'/';
		try {
			fs.accessSync(dir);
		} catch (err) {
			logger.info('Criando diretorio ' + dir, err);
			fs.mkdirSync(dir);
		}
		callback(null, dir);
	},
	filename:function(req, file, callback) {
		callback(null, req.body.type + file.originalname.replace(/.*(\.[a-z]+)/,'$1'));
	}
});
var upload = multer({'storage': storage}).single('image');


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
		logger.info(err);
		return res.render('500');
	}
	res.locals.gAnalytics = false;
	next();
});

// funcao render utilizando a templatizacao do site
app.use(function(req, res, next) {
	if (res) {
		res.g2render = function(page, params) {
			var g2params = {};
			
			if (!params)
				params = {};
			if (!params.pageTitle)
				params.pageTitle = false;
			if (!params.fadeMenu)
				params.fadeMenu = false;
			if (!params.description)
				params.description = 'Guilherme Gomes - Tutoriais, artigos, curiosidades e outras informações. Site pessoal do profissional de TI, desenvolvedor e arquiteto de softwares Guilherme Gomes.';
			if (!params.keywords)
				params.keywords = 'Guilherme,Gomes,desenvolvedor,arquiteto';
			
			g2params.page = '../' + page;
			g2params.params = params;
			res.render('template/template', g2params);
		}
	}
	next();
});

require('./passport.js')(app, passport, LocalStrategy);

//criando pool de conexões e configurando as páginas do site
pages.config(app, upload);


app.use(function(req, res, next) {
  res.status(404).send('Sorry cant find that!');
});

//iniciando serviço
var server = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  logger.info("Servidor iniciado em", addr.address + ":" + addr.port);
});
