var BizError = require('../error');
var ERROR_CODES = require('../ERROR_CODES');
var util = require('../util');
var sqlUtil = require('../sql-util');
var post = require('../post/functions');

var availableLocales = function(callback) {
	var selectMap = {
		table: 'directory',
		fields: 'distinct(locale) as disloc'
	};
	sqlUtil.executeQuery(g2pool, selectMap, function(err, rows) {
		if (err) {
			if (err.g2Error) {
				return callback(err);
			}
			return callback(new BizError(err, ERROR_CODES.DIR_SELECT_ALL,
					'Erro carregando arvore de diretorios'));
		}

		var responseArray = [];
		for (var i in rows) {
			responseArray.push(rows[i].disloc);
		}
		callback(null, responseArray);
	});
};

var fullDirectoryTree = function(locale, callback) {
	function addDirToArray(arr, row) {
		var node = {
			id : row.id,
			name : row.name,
			uniqueName : row.uniqueName,
			path: row.path,
			fullpath: row.fullpath,
			children : []
		};
		arr.push(node);
	}
	function findBeforeAdd(dirTree, row) {
		var index;
		for (index in dirTree) {
			var node = dirTree[index];
			if (node.id == row.parentId) {
				addDirToArray(node.children, row);
			} else {
				findBeforeAdd(node.children, row);
			}
		}
	}

	var errMsg = util.missingParameter([ {
		param : locale,
		message : 'Locale deve ser fornecido'
	} ]);
	if (errMsg) {
		return callback(errMsg);
	}

	var findAllDir = {
		table : 'directory',
		where : { 'locale' : locale },
		orderBy : ['parentId','name']
	};
	sqlUtil.executeQuery(g2pool, findAllDir, function(err, rows) {
		if (err) {
			if (err.g2Error) {
				return callback(err);
			}
			return callback(new BizError(err, ERROR_CODES.DIR_SELECT_ALL,
					'Erro carregando arvore de diretorios'));
		}
		var dirTree = [];
		var index;
		for (index in rows) {
			var row = rows[index];
			if (row.parentId == null) {
				addDirToArray(dirTree, row);
			} else {
				findBeforeAdd(dirTree, row);
			}
		}
		
		callback(null, dirTree);
	});
};

var isValidUniqueName = function(uniqueName, locale, callback) {
	var countUnique = {
		table : 'directory',
		fields : 'count(*) as numregs',
		where : {
			'uniqueName' : uniqueName,
			'locale': locale
		}
	};
	sqlUtil.executeQuery(g2pool, countUnique, function(err, rows) {
		if (err) {
			if (err.g2Error) {
				return callback(err);
			}
			return callback(new BizError(err, ERROR_CODES.DIR_NUM_UNIQUE_NAME,
					'Erro ao buscar conexão do Pool de Conexões'));
		}

		if (rows[0].numregs) {
			return callback(new BizError(null,
					ERROR_CODES.DIR_UNIQUE_NAME_DUPLICATE,
					'Já existe um registro com o uniqueName fornecido'));
		}
		callback(null);
	});
};

var addTreeNode = function(params, callback) {
	var errMsg = util.missingParameter([ {
		param : params.name,
		message : 'Nome deve ser fornecido'
	}, {
		param : params.uniqueName,
		message : 'Nome único deve ser fornecido'
	}, {
		param : params.locale,
		message : 'Locale deve ser fornecido'
	}, {
		param : params.path,
		message : 'Caminho deve ser fornecido'
	}, {
		param : params.fullpath,
		message : 'Caminho completo deve ser fornecido'
	} ]);
	if (errMsg) {
		res.send(errMsg);
		return;
	}
	isValidUniqueName(params.uniqueName, params.locale, function(err) {
		if (err) {
			return callback(err);
		}

		var insertMap = {
			table: 'directory',
			fields: {
				'name': params.name,
				'uniqueName': params.uniqueName,
				'path': params.path,
				'fullpath': params.fullpath,
				'parentId': (params.parentId ? params.parentId : null),
				'locale': params.locale
			},
			type:'insert'
		};
		sqlUtil.executeQuery(g2pool, insertMap, function (err) {
			if (err) {
				if (err.g2Error) {
					return callback(err);
				}
				return callback(new BizError(err, ERROR_CODES.DIR_INSERT_QUERY,
						'Erro ao buscar conexão do Pool de Conexões'));
			}

			fullDirectoryTree(params.locale, callback);
		});
	});

};

var removeTreeNode = function(directoryId, locale, callback) {
	var errMsg = util.missingParameter([ {
		param : directoryId,
		message : 'ID deve ser fornecido'
	} ]);
	if (errMsg) {
		return callback(errMsg);
	}

	var deleteMap = {
		table: 'directory',
		where: {'id': directoryId},
		type:'delete'
	};
	sqlUtil.executeQuery(g2pool, deleteMap, function(err) {
		if (err) {
			if (err.g2Error) {
				return callback(err);
			}
			return callback(new BizError(err, ERROR_CODES.DIR_INSERT_QUERY,
					'Erro ao buscar conexão do Pool de Conexões'));
		}

		fullDirectoryTree(locale, callback);
	});
};



var getDirectoryContent = function(locale, directoryId, callback) {
	var errMsg = util.missingParameter([ {
		param : locale,
		message : 'Locale deve ser fornecido'
	} ]);
	if (errMsg) {
		return res.send(errMsg);
	}
	
	findChildDirectories(locale, directoryId, function(err, dirs) {
		if (err)
			return callback(err);
		
		post.findPostsByDirectory(locale, directoryId, function(err, posts) {
			if (err)
				return callback(err);
			
			callback(null, {'directories': dirs, 'posts': posts});
		});
	});
};

var findChildDirectories = function(locale, directoryId, callback) {
	var selectMap = {
		table: 'directory',
		where: {
			'parentId': directoryId,
			'locale': locale
		},
		orderBy : 'name'
	};
	sqlUtil.executeQuery(g2pool, selectMap, function (err, rows) {
		if (err) {
			if (err.g2Error) {
				return callback(err);
			}
			return callback(new BizError(err, ERROR_CODES.DIR_GET_CONTENT,
					'Erro ao buscar conteudo do diretorio "' + directoryId + '"'));
		}

		var dirs = [];
		for (i in rows) {
			var row = rows[i];
			dirs.push({
				id : row.id,
				name : row.name,
				uniqueName : row.uniqueName
			});
		}
		callback(null, dirs);
	});
};



module.exports.fullDirectoryTree = fullDirectoryTree;
module.exports.addTreeNode = addTreeNode;
module.exports.removeTreeNode = removeTreeNode;
module.exports.availableLocales = availableLocales;
module.exports.getDirectoryContent = getDirectoryContent;
