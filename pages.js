//dependencias
var dirTree = require('./package/dir_tree/functions');
var post = require('./package/post/functions');
var i18n = require('./package/i18n/lang.js');
var BizError = require('./package/error');

//configuracao de paginas do site
var config = function(app, upload) {
    app.get('/', function(req,res) {
		post.homeList(function(err, posts){
			if (err) {
				console.log(err);
				return res.g2render('index', {'fadeMenu':true, 'posts':[]});
			}
			res.g2render('index', {'fadeMenu':true, 'posts': posts});
		});
    });
	
    app.get('/blog', function(req,res) {
		res.g2render('blog', {'fadeMenu':true});
    });
	
    app.get('/blog/*', function(req,res) {
		var fullpath = req.path.replace(/.*\/blog\/(.*)/,'$1');
		post.findPostByPath(fullpath, function(err, post) {
			if (err) {
				if (err.g2error) {
					return err.sendResponse(req, res);
				}
				console.log('pages.blog/post:', err);
				res.setStatus(500).send(err);
			}
			if (!post)
				return BizError.notFoun(req, res);
			res.g2render('post', {'fadeMenu':false, 'post': post});
		});
    });

    /*
     *****************************************
     * Configuracao de paginas de diretorios *
     *****************************************
     */
    // Manutencao de diretorios
    app.get('/directoryTree', function(req,res) {
      res.render('directoryTree');
    });
    // Chamada assincrona de criacao de diretorio
    app.post('/addTreeNode', isLoggedIn, function(req, res){
		dirTree.addTreeNode({
			'name': req.query.name,
			'uniqueName': req.query.uniqueName,
			'path': req.query.path,
			'fullpath': req.query.fullpath,
			'parentId': (req.query.parentId ? req.query.parentId : null),
			'locale': req.query.locale
		}, function(err, dirTree){
			if (err) {
				if (err.push) {
					return res.send(err);
				}
				if (err.g2error) {
					return err.sendResponse(req, res);
				}
				console.log('pages.addTreeNode:', err);
				res.setStatus(500).send(err);
			}
			res.setHeader('content-type', 'tetx/javascript');
			res.send(dirTree);
		});
	});
    // Chamada assincrona de remocao de diretorio
    app.post('/removeTreeNode', isLoggedIn, function(req, res){
		dirTree.removeTreeNode(req.query.did, req.query.locale, function(err, dirTree){
			if (err) {
				if (err.push) {
					return res.send(err);
				}
				if (err.g2error) {
					return err.sendResponse(req, res);
				}
				console.log('pages.removeTreeNode:', err);
				res.setStatus(500).send(err);
			}
			res.setHeader('content-type', 'tetx/javascript');
			res.send(dirTree);
		});
	});
    // Chamada assincrona de JSON da arvore completa de diretorios
    app.all('/fullDirectoryTree', function(req, res){
		dirTree.fullDirectoryTree(req.query.locale, function(err, dirTree){
			if (err) {
				if (err.push) {
					return res.send(err);
				}
				if (err.g2error) {
					return err.sendResponse(req, res);
				}
				console.log('pages.removeTreeNode:', err);
				res.setStatus(500).send(err);
			}
			res.setHeader('content-type', 'tetx/javascript');
			res.send(dirTree);
		});
	});
    // Locales disponiveis na estrutura de diretorios
    app.all('/dirAvailableLocales', function(req, res){
		dirTree.availableLocales(function(err, locales){
			if (err) {
				if (err.g2error) {
					return err.sendResponse(req, res);
				}
				console.log('pages.removeTreeNode:', err);
				res.setStatus(500).send(err);
			}
			res.setHeader('content-type', 'tetx/javascript');
			res.send(locales);
		});
	});
    // Busca conteudo de um diretorio
    app.all('/dirContent', function(req, res){
		dirTree.getDirectoryContent(req.query.locale, req.query.dirId, function(err, content){
			if (err) {
				if (err.push) {
					return res.send(err);
				}
				if (err.g2error) {
					return err.sendResponse(req, res);
				}
				console.log('pages.removeTreeNode:', err);
				res.setStatus(500).send(err);
			}
			res.setHeader('content-type', 'tetx/javascript');
			res.send(content);
		});
	});
	

	app.all('/admin/', isLoggedIn, function(req, res){
		res.g2render('adm/index', {'fadeMenu':false});
	});
	
	app.post('/admin/upload', isLoggedIn, function(req, res) {
		upload(req, res, function(err){
			if (err) {
				return res.end('Error uploading file');
			}
			if (req.body.type == 'thumbnail') {
				post.addThumbnail(req.body.id, req.file.filename, function(err){
					if (err) {
						if (err.g2error) {
							return err.sendResponse(req, res);
						}
						console.log('admin.upload:', err);
						res.setStatus(500).send(err);
					}
					res.end('OK');
				});
			}
			if (req.body.type == 'poster') {
				post.addPoster(req.body.id, req.file.filename, function(err){
					if (err) {
						if (err.g2error) {
							return err.sendResponse(req, res);
						}
						console.log('admin.upload:', err);
						res.setStatus(500).send(err);
					}
					res.end('OK');
				});
			}
		});
	});


    /*
     *****************************************
     *   Configuracao de paginas de posts    *
     *****************************************
     */
    // Pagina de manutenção de post
    app.get('/createPost', isLoggedIn, function(req,res){
      res.render('createPost');
    });
	// Chamada assincrona para buscar post
	app.all('/findPostById', post.findPostById);
    // Chamada assincrona para criacao de post
    app.post('/mergePost', isLoggedIn, post.mergePost);
}

module.exports.config = config;
