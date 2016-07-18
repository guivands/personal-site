var BizError = require('../error');
var ERROR_CODES = require('../ERROR_CODES');
var util = require('../util');
var sqlUtil = require('../sql-util');

const REGS_PER_PAGE = 9;


var mapPost = function(row) {
	return {
		'id' : row.id,
		'uniqueName' : row.uniqueName,
		'title' : row.title,
		'description' : row.description,
		'tags' : row.tags,
		'directoryId' : row.directoryId,
		'path' : row.path,
		'fullpath' : row.fullpath,
		'post' : row.post,
		'locale' : row.locale,
		'numVisits' : row.numVisits,
		'thumbnail' : row.thumbnail,
		'poster' : row.poster,
		'createDate' : row.createDate,
		'updateDate': row.updateDate
	};
};

var homeList = function(locale, callback){
	var posts = [];

	var sql = 'select p.id, p.title, p.fullpath, p.thumbnail, d.name from post p, directory d where p.directoryId = d.id and p.locale = ? order by numVisits desc limit 2';
	g2pool.query(sql, [locale], function (err, rows) {
		if(err) {
			return callback(new BizError(err, ERROR_CODES.POST_HOME_MOST_VIEW, 'Erro ao buscar posts mais acessados'));
		}
		var ids = [];
		for (var i in rows) {
			var row = rows[i];
			posts.push({
				'id': row.id,
				'title': row.title,
				'fullpath': row.fullpath,
				'thumbnail': row.thumbnail,
				'directoryName': row.name
			});
			ids.push(row.id);
		}
		
		sql = 'select p.id, p.title, p.fullpath, p.thumbnail, d.name from post p, directory d where p.directoryId = d.id and p.locale = ? ';
		if (ids.length > 0) {
			sql += ' and p.id not in (';
			for(var j = 0; j < ids.length; j++) {
				sql += ids[j];
				if (j + 1 < ids.length)
					sql += ',';
			}
			sql += ')';
		}
		sql += ' limit 1';
		
		g2pool.query(sql, [locale], function (err, rows2){
			if(err) {
				return callback(new BizError(err, ERROR_CODES.POST_HOME_LATEST, 'Erro ao buscar post mais novo'));
			}
			if (rows2.length > 0) {
				posts.push({
					'id': rows2[0].id,
					'title': rows2[0].title,
					'fullpath': rows2[0].fullpath,
					'thumbnail': rows2[0].thumbnail,
					'directoryName': rows2[0].name
				});
			}
			
			callback(null, posts);
		});
	});
};

var findPostById = function(req, res) {
	var selectMap = {
		table:'post',
		where:{
			'id': req.query.id
		}
	};
	sqlUtil.executeQuery(g2pool, selectMap, function(err, rows) {
		if(err) {
			if (err.g2Error) {
				return err.sendResponse(req, res);
			}
			return new BizError(err, ERROR_CODES.POST_FIND_POST, 'Erro procurando pelo post id "' + req.query.id + '"').sendResponse(req, res);
		}
		
		if(rows.length == 0){
			return new BizError(err, ERROR_CODES.POST_FIND_POST, 'Nenhum post encontrado').sendResponse(req, res);
		}
		
		var post = mapPost(rows[0]);
		res.setHeader('content-type', 'text/json');
		res.send(post);
	});
};

var findPostByPath = function(fullpath, callback) {
	var findPost = {
		table:'post',
		where:{'fullpath':fullpath}
	};
	sqlUtil.executeQuery(g2pool, findPost, function(err, rows) {
		if(err) {
			if (err.g2Error) {
				return callback(err);
			}
			return callback(new BizError(err, ERROR_CODES.POST_FIND_POST, 'Erro procurando pelo post ' + relPath));
		}
		if (rows.length == 0) {
			return callback(null, null);
		} else {
			callback(null, mapPost(rows[0]));
		}
	});
};

var isUsed = function(g2pool, whereMap, callback) {
	var sqlMap = {
		fields:'count(*) as numregs',
		table:'post',
		where:whereMap
	};
	sqlUtil.executeQuery(g2pool, sqlMap, function(err, rows) {
		if (err) {
			return callback(err);
		}
		if (rows[0].numregs > 0) {
			return callback(new BizError(null, ERROR_CODES.POST_COUNT_GT_0, 'Count retornou mais de um registro'));
		}
		callback(null);
	});
};

var insertPost = function(g2pool, req, res) {
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
			'fullpath':req.body.fullpath,
			'post':req.body.post,
			'locale':req.body.locale,
			'numVisits':0,
			'createDate':new Date(),
			'updateDate':new Date()
		}
	};
	
	sqlUtil.executeQuery(g2pool, sqlMap, function(err, rows) {
		if(err) {
			if (err.g2Error) {
				return err.sendResponse(req, res);
			}
			
			return new BizError(err, ERROR_CODES.POST_CREATE, 'Erro ao adicionar post').sendResponse(req, res);
		}
		BizError.success(req, res);
	});
};

var mergePost = function(req, res) {
	if (!req.body.directoryId) {
		req.body.directoryId = null;
	}
	var errMsg = util.missingParameter([
		{param:req.body.uniqueName,message:'Nome único deve ser fornecido'},
		{param:req.body.title,message:'Título deve ser fornecido'},
		{param:req.body.description,message:'Description deve ser fornecido'},
		{param:req.body.tags,message:'Tags deve ser fornecido'},
		{param:req.body.path,message:'Caminho deve ser fornecido'},
		{param:req.body.fullpath,message:'Caminho completo deve ser fornecido'},
		{param:req.body.post,message:'Conteúdo do post deve ser fornecido'},
		{param:req.body.locale,message:'Locale deve ser fornecido'}
	]);
	if (errMsg) {
		res.send(errMsg);
		return;
	}
	
	if (req.body.id) {
		updatePost(req, res);
	} else {
		addPost(req, res);
	}
};

var updatePost = function(req, res) {
	var sqlMap = {
		type:'update',
		table:'post',
		fields:{
			'description':req.body.description,
			'tags':req.body.tags,
			'post':req.body.post,
			'updateDate':new Date()
		},
		where: {
			'id': req.body.id
		}
	};
	
	sqlUtil.executeQuery(g2pool, sqlMap, function(err, rows) {
		if(err) {
			if (err.g2Error) {
				return err.sendResponse(req, res);
			}
			
			return new BizError(err, ERROR_CODES.POST_UPDATE, 'Erro ao atualizar post').sendResponse(req, res);
		}
		BizError.success(req, res);
	});
};

var addPost = function(req, res) {
	var whereMap = {'uniqueName':req.body.uniqueName};
	
	var checkPathDir = function(err) {
		if(err) {
			if(err.g2Error && err.code == ERROR_CODES.POST_COUNT_GT_0) {
				return new BizError(null, ERROR_CODES.POST_PATH_DUPLICATE, 'Título duplicado').sendResponse(req, res);
			}
			return new BizError(err, ERROR_CODES.POST_CREATE, 'Erro ao adicionar post').sendResponse(req, res);
		}
		insertPost(g2pool, req, res);
	};
	var checkTitle = function (err) {
		if(err) {
			if(err.g2Error && err.code == ERROR_CODES.POST_COUNT_GT_0) {
				return new BizError(null, ERROR_CODES.POST_TITLE_DUPLICATE, 'Título duplicado').sendResponse(req, res);
			}
			return new BizError(err, ERROR_CODES.POST_CREATE, 'Erro ao adicionar post').sendResponse(req, res);
		}
		whereMap = {'path':req.body.path, 'directoryId':req.body.directoryId};
		isUsed(g2pool, whereMap, checkPathDir);
	};
	var checkUniqueName = function(err) {
		if(err) {
			if(err.g2Error && err.code == ERROR_CODES.POST_COUNT_GT_0) {
				return new BizError(null, ERROR_CODES.POST_UNIQUE_NAME_DUPLICATE, 'Unique name duplicado').sendResponse(req, res);
			}
			return new BizError(err, ERROR_CODES.POST_CREATE, 'Erro ao adicionar post').sendResponse(req, res);
		}
		whereMap = {'title':req.body.title};
		isUsed(g2pool, whereMap, checkTitle);
	};
	
	isUsed(g2pool, whereMap, checkUniqueName);
};

var findPostsByDirectory = function(locale, directoryId, callback) {
	var selectMap = {
		table: 'post',
		fields: ['id', 'uniqueName', 'title', 'directoryId', 'path', 'locale', 'createDate', 'updateDate'],
		where: {
			'directoryId': directoryId,
			'locale': locale
		},
		orderBy: 'title'
	};
	sqlUtil.executeQuery(g2pool, selectMap, function(err, rows) {
		if(err) {
			if (err.g2Error) {
				return callback(err);
			}
			
			return callback(new BizError(err, ERROR_CODES.POST_FIND_BY_DIRECTORY, 'Erro ao buscar posts do diretorio "' + directoryId + '"'));
		}
		
		var posts = [];
		for (i in rows) {
			var row = rows[i];
			posts.push({
				'id': row.id,
				'uniqueName': row.uniqueName,
				'title': row.title,
				'directoryId': row.directoryId,
				'path': row.path,
				'locale': row.locale,
				'createDate': row.createDate,
				'updateDate': row.updateDate
			});
		}
		callback(null, posts);
	});
};

var addThumbnail = function(postId, thumbnailName, callback) {
	var update = {
		table: 'post',
		type: 'update',
		fields: {
			'thumbnail': thumbnailName
		},
		where: {
			'id': postId
		}
	};
	sqlUtil.executeQuery(g2pool, update, function(err) {
		callback(err);
	});
};

var addPoster = function(postId, posterName, callback) {
	var update = {
		table: 'post',
		type: 'update',
		fields: {
			'poster': posterName
		},
		where: {
			'id': postId
		}
	};
	sqlUtil.executeQuery(g2pool, update, function(err) {
		callback(err);
	});
};

var listBlogPosts = function(locale, page, directoryId, callback) {
	if (!page)
		page = 0;
	
	var sql = 'select p.id, p.title, p.fullpath, p.thumbnail, d.name from post p, directory d where p.directoryId = d.id and p.locale = ?';
	var params = [locale];
	if (directoryId) {
		params.push(directoryId);
		sql += ' and d.id = ?';
	}
	if (page > 0) {
		sql += ' limit ' + (page-1 * REGS_PER_PAGE) + ', ' + REGS_PER_PAGE;
	} else {
		sql += ' limit ' + REGS_PER_PAGE;
	}
	
	g2pool.query(sql, params, function (err, rows){
		if (err)
			return callback(err);
		var posts = [];
		for (var i in rows) {
			var row = rows[i];
			posts.push({
				'id': row.id,
				'title': row.title,
				'fullpath': row.fullpath,
				'thumbnail': row.thumbnail,
				'directoryName': row.name
			});
		}
		callback(null, posts);
	});
}

module.exports.findPostByPath = findPostByPath;
module.exports.addPost = addPost;
module.exports.updatePost = updatePost;
module.exports.mergePost = mergePost;
module.exports.findPostsByDirectory = findPostsByDirectory;
module.exports.findPostById = findPostById;
module.exports.homeList = homeList;
module.exports.addPoster = addPoster;
module.exports.addThumbnail = addThumbnail;
module.exports.listBlogPosts = listBlogPosts;
