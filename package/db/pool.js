var mysql = require("mysql");
var dbConfig = require("./db-config.js");

exports.createPool = function(){
    console.log("creating connection pool...");
    var pool = mysql.createPool({
        host:dbConfig.host,
        user:dbConfig.user,
        password:dbConfig.pass,
        database:dbConfig.database
    });
    console.log("connection pool created");
    
    return pool;
}