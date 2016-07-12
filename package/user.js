var sqlUtil = require('./sql-util');
var bcrypt = require('bcrypt-nodejs');

/*
var hash = bcrypt.hashSync('12345');
console.log(hash);
console.log(bcrypt.compareSync("bacon", hash));
console.log(bcrypt.compareSync("idjsjds", hash));
console.log(bcrypt.compareSync("12345", hash));
*/

var findUser = function(username, callback) {
	var sqlMap = {
		table:'g2user',
		where:{
			'username':username
		}
	};
	sqlUtil.executeQuery(g2pool, sqlMap, function(err, rows) {
		if (err)
			return callback(err);
		
		if (rows.length == 0)
			return callback(null, null);
		
		var user = {
			'username': username,
			'password': rows[0].password,
			'validatePassword': function(pwd) {
				return bcrypt.compareSync(pwd, this.password);
			}
		};
		callback(null, user);
	});
};

module.exports.findUser = findUser;
