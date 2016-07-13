var BizError = require('./error');
var ERROR_CODES = require('./ERROR_CODES');

var createSQL = function(sqlMap) {
    if (!sqlMap)
        throw new Error('Mapa de parâmetros deve ser fornecido');
    if (!sqlMap.table)
        throw new Error('Mapa de parâmetros deve ser conter o elemento table');
    var type = sqlMap.type;
	if (!type)
		type = 'select';

    switch(type) {
		case 'select': return selectSQL(sqlMap);
		case 'insert':
			if (sqlMap.where) {
				throw new Error('CREATE SQL: tipo insert não pode ter instrução where');
			}
			if (sqlMap.orderBy) {
				throw new Error('CREATE SQL: tipo insert não pode ter instrução orderBy');
			}
			if (!sqlMap.fields) {
				throw new Error('CREATE SQL: tipo insert requer instrução fields');
			}
			return insertSQL(sqlMap);
		case 'update':
			if (sqlMap.orderBy) {
				throw new Error('CREATE SQL: tipo update não pode ter instrução orderBy');
			}
			if (!sqlMap.fields) {
				throw new Error('CREATE SQL: tipo update requer instrução fields');
			}
			return updateSQL(sqlMap);
		case 'delete':
			if (sqlMap.orderBy) {
				throw new Error('CREATE SQL: tipo delete não pode ter instrução orderBy');
			}
			if (sqlMap.fields) {
				throw new Error('CREATE SQL: tipo delete não pode ter instrução fields');
			}
			return deleteSQL(sqlMap);
	}
};

var deleteSQL = function(sqlMap) {
	var sql = 'delete from ' + sqlMap.table;
	var params = [];
	if (sqlMap.where) {
		sql += ' where ';
		var ws = whereSQL(sqlMap.where, ' and ');
        sql = sql.concat(ws.sql);
        params = params.concat(ws.params);
	}

    sql = sql.replace(/ +/g, ' ');
	return {'sql':sql, 'params': params};
};

var updateSQL = function(sqlMap) {
	var sql = 'update ' + sqlMap.table + ' set ';
	var params = [];
	for (var i in sqlMap.fields) {
		sql += i + ' = ?, ';
		params.push(sqlMap.fields[i]);
	}
	sql = sql.substring(0, sql.length - 2);

	if (sqlMap.where) {
		sql += ' where ';
		var ws = whereSQL(sqlMap.where, ' and ');
        sql = sql.concat(ws.sql);
        params = params.concat(ws.params);
	}
    sql = sql.replace(/ +/g, ' ');
	return {'sql':sql, 'params':params};
};

var insertSQL = function(sqlMap) {
	var sql = 'insert into ' + sqlMap.table + ' (';
	var fields = '';
	var values = '';
	var params = [];
	for (var i in sqlMap.fields) {
		fields += i + ', ';
		values += '?, ';
		params.push(sqlMap.fields[i]);
	}
	fields = fields.substring(0, fields.length - 2);
	values = values.substring(0, values.length - 2);

	sql += fields + ') values (' + values + ')';
	return {'sql':sql, 'params':params};
};

var selectSQL = function(sqlMap) {
	var sql = 'select ';
    var params = [];
    if (sqlMap.fields) {
        if (sqlMap.fields.push) {
            for (var i in sqlMap.fields) {
                sql = sql.concat(sqlMap.fields[i]).concat(', ');
            }
            sql = sql.substring(0, sql.length - 2);
        } else {
            sql = sql.concat(sqlMap.fields).concat(' ');
        }
    } else {
        sql = sql.concat(' * ');
    }

    sql = sql.concat(' from ').concat(sqlMap.table).concat(' ');

    if (sqlMap.where) {
        var ws = whereSQL(sqlMap.where, ' and ');
        sql = sql.concat(' where ' + ws.sql);
        params = params.concat(ws.params);
    }

    if(sqlMap.orderBy) {
        sql += orderBy(sqlMap.orderBy);
    }

	if (sqlMap.limit) {
		if (sqlMap.limit.max) {
			sql += ' limit ' + (sqlMap.limit.first ? sqlMap.limit.first + ',' : '') + sqlMap.limit.max;
		}
		sql += ' limit ' + sqlMap.limit;
	}
	
    sql = sql.replace(/ +/g, ' ');
    return {'sql':sql, 'params':params};
};

var orderBy = function(ob) {
    var sql = ' order by ';
    if (ob.push) {
        for (var i in ob) {
            sql += ob[i] + ' asc, ';
        }
        sql = sql.substring(0, sql.length -2);
    } else if (typeof ob == 'string') {
        sql += ob;
    } else {
        for(var i in ob) {
            sql += i + ' ' + ob[i] + ', ';
        }
        sql = sql.substring(0, sql.length -2);
    }
    return sql;
};

var whereSQL = function(obj, op) {
    var ret = {sql:'', params:[]};

    if (obj.push) {
        for (var i in obj) {
            var e = obj[i];
            var ws = whereSQL(e, op);
            ret.sql += ' ' + ws.sql + ' ' + op;
            ret.params = ret.params.concat(ws.params);
        }
        ret.sql = ret.sql.substring(0, ret.sql.length - op.length);
    } else if (obj.and) {
        var ws = whereSQL(obj.and, ' and ');
        ret.sql += ' ' + ws.sql + ' ';
        ret.params = ret.params.concat(ws.params);
    } else if (obj.or) {
        var ws = whereSQL(obj.or, ' or ');
        ret.sql += ' (' + ws.sql + ') ';
        ret.params = ret.params.concat(ws.params);
    } else if (typeof obj == 'string') {
        ret.sql += obj;
    } else {
        var wf = whereFields(obj, op);
        ret.sql += ' ' + wf.sql + ' ';
        ret.params = ret.params.concat(wf.params);
    }
    return ret;
};

var whereFields = function(fields, op) {
    var ret = {sql:'', params:[]};
    for (var field in fields) {
        if (fields[field] == undefined || fields[field] == null) {
            ret.sql = ret.sql.concat(' ' + field + ' is null ' + op);
        } else if (fields[field].push) {
			ret.sql += ' ' + field + ' in (';
			for (var i in fields[field])  {
				ret.sql += '?, ';
				ret.params.push(fields[field][i]);
			}
			ret.sql = ret.sql.substring(0, ret.sql.length - 2);
			ret.sql += ') ' + op;
		} else {
            ret.sql = ret.sql.concat(' ' + field + ' = ? ' + op);
            ret.params.push(fields[field]);
        }
    }
    ret.sql = ret.sql.substr(0, ret.sql.length - op.length);
    return ret;
};

var executeQuery = function (pool, sqlMap, callback) {
	var cs = createSQL(sqlMap);
	pool.query(cs.sql, cs.params, function (err, rows) {
		if(err) {
			return callback(err);
		}
		return callback(null, rows);
	});
};


module.exports.createSQL = createSQL;
module.exports.executeQuery = executeQuery;




/*
var sqlMap = {
    table:'post',
    fields: ['id', 'title', 'description', 'path'],
    where:{
        and: [
            {
                or: {
                    'uniqueName': 'lalala',
                    'path': 'my_path'
                }
            },
            {
                or: {
                    'title':'Eu procuro algo',
                    'description': 'minha descricao'
                }
            }
        ]
    },
    orderBy: {
        'directoryId':'asc',
        'path':'desc'
    }
};

var sqlMapInsert = {
	table:'pessoa',
	fields:{
		'nome':'guilherme',
		'sobrenome':'gomes',
		'idade':31
	},
	type:'insert'
};

var sqlMapUpdate = {
	table:'post',
	fields:{
		'path':'caminho_na_url'
	},
	where: {
		'id':11,
		'description':'guilherme'
	},
	type:'update'
};

var sqlMapDelete = {
	table:'post',
	where: {
		or: [
			{and:{
				'description':'guilherme',
				'path':'guilherme'
			}},
			{and:{
				'id':[2,11],
				'path':'guilherme'
			}}
		]
	},
	type:'delete'
};

console.log('== SELECT ==================================================================');
var cs = createSQL(sqlMap);
console.log(cs.sql);
console.log(cs.params);
console.log('\n');

console.log('== INSERT ==================================================================');
cs = createSQL(sqlMapInsert);
console.log(cs.sql);
console.log(cs.params);
console.log('\n');

console.log('== UPDATE ==================================================================');
cs = createSQL(sqlMapUpdate);
console.log(cs.sql);
console.log(cs.params);
console.log('\n');

console.log('== DELETE ==================================================================');
cs = createSQL(sqlMapDelete);
console.log(cs.sql);
console.log(cs.params);
console.log('\n');
*/