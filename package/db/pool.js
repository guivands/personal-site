var mysql = require("mysql");
var dbConfig = require("./db-config.js");


console.log("creating connection pool...");
var pool = mysql.createPool({
	host:dbConfig.host,
	user:dbConfig.user,
	password:dbConfig.pass,
	database:dbConfig.database,
	connectionLimit:10
});
console.log("connection pool created");
    
global.g2pool = pool;

