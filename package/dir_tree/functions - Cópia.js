var BizError = require('../error');
var ERROR_CODES = require('../ERROR_CODES');
var util = require('../util');
var sqlUtil = require('../sql-util');
var post = require('../post/functions');

var pool;
module.exports.setPool = function(p) {
	pool = p;
};

var availableLocales = function(req, res) {
	var selectMap = {
		table: 'directory',
		fields: 'distinct(locale) as disloc'
	};
	sqlUtil.executeQuery(pool, selectMap, function(err, rows) {
		if (err) {
			if (err.g2Error) {
				return err.sendResponse(req, res);
			}
			return new BizError(err, ERROR_CODES.DIR_SELECT_ALL,
					'Erro carregando arvore de diretorios').sendResponse(req,
					res);
		}

		var responseArray = [];
		for (var i in rows) {
			responseArray.push(rows[i].disloc);
		}
		res.send(responseArray);
	});
};

var fullDirectoryTree = function(req, res) {
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
		param : req.query.locale,
		message : 'Locale deve ser fornecido'
	} ]);
	if (errMsg) {
		return res.send(errMsg);
	}

	var findAllDir = {
		table : 'directory',
		where : { 'locale' : req.query.locale },
		orderBy : ['parentId','name']
	};
	sqlUtil.executeQuery(pool, findAllDir, function(err, rows) {
		if (err) {
			if (err.g2Error) {
				return err.sendResponse(req, res);
			}
			return new BizError(err, ERROR_CODES.DIR_SELECT_ALL,
					'Erro carregando arvore de diretorios').sendResponse(req,
					res);
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
		res.setHeader('content-type', 'text/javascript');
		res.send(dirTree);
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
	sqlUtil.executeQuery(pool, countUnique, function(err, rows) {
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

var addTreeNode = function(req, res) {
	var errMsg = util.missingParameter([ {
		param : req.query.name,
		message : 'Nome deve ser fornecido'
	}, {
		param : req.query.uniqueName,
		message : 'Nome único deve ser fornecido'
	}, {
		param : req.query.locale,
		message : 'Locale deve ser fornecido'
	}, {
		param : req.query.path,
		message : 'Caminho deve ser fornecido'
	}, {
		param : req.query.fullpath,
		message : 'Caminho completo deve ser fornecido'
	} ]);
	if (errMsg) {
		res.send(errMsg);
		return;
	}
	isValidUniqueName(req.query.uniqueName, req.query.locale, function(err) {
		if (err) {
			return err.sendResponse(req, res);
		}

		var insertMap = {
			table: 'directory',
			fields: {
				'name': req.query.name,
				'uniqueName': req.query.uniqueName,
				'path': req.query.path,
				'fullpath': req.query.fullpath,
				'parentId': (req.query.parentId ? req.query.parentId : null),
				'locale': req.query.locale
			},
			type:'insert'
		};
		sqlUtil.executeQuery(pool, insertMap, function (err) {
			if (err) {
				if (err.g2Error) {
					return err.sendResponse(req, res);
				}
				return new BizError(err, ERROR_CODES.DIR_INSERT_QUERY,
						'Erro ao buscar conexão do Pool de Conexões').sendResponse(req, res);
			}

			fullDirectoryTree(req, res);
		});
	});

};

var removeTreeNode = function(req, res) {
	var errMsg = util.missingParameter([ {
		param : req.query.did,
		message : 'ID deve ser fornecido'
	} ]);
	if (errMsg) {
		res.send(errMsg);
		return;
	}

	var deleteMap = {
		table: 'directory',
		where: {'id': req.query.did},
		type:'delete'
	};
	sqlUtil.executeQuery(pool, deleteMap, function(err) {
		if (err) {
			if (err.g2Error) {
				return callback(err);
			}
			return new BizError(err, ERROR_CODES.DIR_INSERT_QUERY,
					'Erro ao buscar conexão do Pool de Conexões').sendResponse(req, res);
		}

		fullDirectoryTree(req, res);
	});
};



var getDirectoryContent = function(req, res) {
	var errMsg = util.missingParameter([ {
		param : req.query.locale,
		message : 'Locale deve ser fornecido'
	} ]);
	if (errMsg) {
		return res.send(errMsg);
	}
	
	var locale = req.query.locale;
	var directoryId = req.query.dirId ? req.query.dirId : null;
	findChildDirectories(locale, directoryId, function(err, dirs) {
		if (err)
			err.sendResponse(req, res);
		
		post.findPostsByDirectory(locale, directoryId, function(err, posts) {
			if (err)
				err.sendResponse(req, res);
			
			res.send({'directories': dirs, 'posts': posts});
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
	sqlUtil.executeQuery(pool, selectMap, function (err, rows) {
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
