var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var ejs = require('ejs');


//acesso ao BD
var db = require('./package/db/pool');
var pages = require('./pages');


var app = express();

app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.use('/client', express.static('client'));
app.use(function(err, req, res, next){
  console.error("madafoca");
});
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

var pool = db.createPool();
pages.config(app, pool);


var server = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Servidor iniciado em", addr.address + ":" + addr.port);
});