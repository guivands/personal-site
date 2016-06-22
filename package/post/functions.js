var BizError = require('../error');
var ERROR_CODES = require('../ERROR_CODES');
var util = require('../util');
var sqlUtil = require('../sql-util');

var pool;
module.exports.setPool = function(p) {
    pool = p;
};

var findPost = function(req,res) {
	// pega só o caminho relativo, com tudo que vem depois de /post/
	var relPath = req.path.replace(/\/post\//,'');
	var findPost = {
		table:'post',
		where:{'path':relPath}
	};
	sqlUtil.executeQuery(pool, findPost, function(err, rows) {
		if(err) {
			if (err.g2Error) {
				return err.sendResponse(req, res);
			}
			return new BizError(err, ERROR_CODES.POST_FIND_POST, 'Erro procurando pelo post ' + relPath).sendResponse(req, res);
		}
		if (rows.length == 0) {
			BizError.notFound(req, res);
		} else {
			var cont="<html><head><title>"+rows[0].titulo+" [G&sup2;]</title></head><body>";
			cont+="<h1>"+rows[0].id +"- "+ rows[0].titulo +"</h1><pre>"+ rows[0].post+"</pre>";
			cont+="</body></html>";
			res.send(cont);
		}
	});
};

var isUsed = function(pool, whereMap, callback) {
	var sqlMap = {
		fields:'count(*) as numregs',
		table:'post',
		where:whereMap
	};
	sqlUtil.executeQuery(pool, sqlMap, function(err, rows) {
		if (err) {
			return callback(err);
		}
		if (rows[0].numregs > 0) {
			return callback(new BizError(null, ERROR_CODES.POST_COUNT_GT_0, 'Count retornou mais de um registro'));
		}
		callback(null);
	});
};

var insertPost = function(pool, req, res) {
	var sqlMap = {
		type:'insert',
		table:'post',
		fields:{
			'uniqueName':req.body.uniqueName,
			'title':req.body.title,
			'description':req.body.description,
			'tags':req.body.tags,
			'directoryId':req.body.directoryId,
			'path':req.body.path,
			'post':req.body.post,
			'locale':req.body.locale,
			'createDate':new Date(),
			'updateDate':new Date()
		}
	};
	
	sqlUtil.executeQuery(pool, sqlMap, function(err, rows) {
		if(err) {
			if (err.g2Error) {
				return err.sendResponse(req, res);
			}
			
			return new BizError(err, ERROR_CODES.POST_CREATE, 'Erro ao adicionar post').sendResponse(req, res);
		}
		BizError.success(req, res);
	});
};

var addPost = function(req, res) {
	if (!req.body.directoryId) {
		req.body.directoryId = null;
	}
	var errMsg = util.missingParameter([
		{param:req.body.uniqueName,message:'Nome único deve ser fornecido'},
		{param:req.body.title,message:'Título deve ser fornecido'},
		{param:req.body.description,message:'Description deve ser fornecido'},
		{param:req.body.tags,message:'Tags deve ser fornecido'},
		{param:req.body.path,message:'Caminho deve ser fornecido'},
		{param:req.body.post,message:'Conteúdo do post deve ser fornecido'},
		{param:req.body.locale,message:'Locale deve ser fornecido'}
	]);
	if (errMsg) {
		res.send(errMsg);
		return;
	}

	var whereMap = {'uniqueName':req.body.uniqueName};
	
	var checkPathDir = function(err) {
		if(err) {
			if(err.g2Error && err.code == ERROR_CODES.POST_COUNT_GT_0) {
				return new BizError(null, ERROR_CODES.POST_PATH_DUPLICATE, 'Título duplicado').sendResponse(req, res);
			}
			return new BizError(err, ERROR_CODES.POST_CREATE, 'Erro ao adicionar post').sendResponse(req, res);
		}
		insertPost(pool, req, res);
	};
	var checkTitle = function (err) {
		if(err) {
			if(err.g2Error && err.code == ERROR_CODES.POST_COUNT_GT_0) {
				return new BizError(null, ERROR_CODES.POST_TITLE_DUPLICATE, 'Título duplicado').sendResponse(req, res);
			}
			return new BizError(err, ERROR_CODES.POST_CREATE, 'Erro ao adicionar post').sendResponse(req, res);
		}
		whereMap = {'path':req.body.path, 'directoryId':req.body.directoryId};
		isUsed(pool, whereMap, checkPathDir);
	};
	var checkUniqueName = function(err) {
		if(err) {
			if(err.g2Error && err.code == ERROR_CODES.POST_COUNT_GT_0) {
				return new BizError(null, ERROR_CODES.POST_UNIQUE_NAME_DUPLICATE, 'Unique name duplicado').sendResponse(req, res);
			}
			return new BizError(err, ERROR_CODES.POST_CREATE, 'Erro ao adicionar post').sendResponse(req, res);
		}
		whereMap = {'title':req.body.title};
		isUsed(pool, whereMap, checkTitle);
	};
	
	isUsed(pool, whereMap, checkUniqueName);
};

module.exports.findPost = findPost;
module.exports.addPost = addPost;
