//dependencias
var dirTree = require('./package/dir_tree/functions');
var post = require('./package/post/functions');
var i18n = require('./package/i18n/lang.js');
var BizError = require('./package/error');
var ERROR_CODES = require('./package/ERROR_CODES');
var mail = require('./package/mail');

//configuracao de paginas do site
var config = function(app, upload) {
    app.get('/', function(req,res) {
		post.homeList('pt', function(err, posts){
			if (err) {
				console.log(err);
				return res.g2render('index', {'fadeMenu':true, 'posts':[]});
			}
			res.g2render('index', {'fadeMenu':true, 'posts': posts});
		});
    });
	
	app.post('/contactme', function (req, res) {
		if (!req.body.name || !req.body.email || !req.body.message) {
			return res.status(500).send('Todos os campos devem ser preenchidos');
		}
		
		var subject = 'Nome: '+ req.body.name + '\nEmail: ' + req.body.email + '\n\nMensagem:\n' + req.body.mensagem;
		mail('from', 'to', 'GuilhermeGom.es - Let\'s create something together', subject, function (err, info) {
			if (err) {
				console.log('pages.home.contactme', err);
				return res.status(500).send('Não foi possível efetuar o contato. Tente novamente mais tarde.');
			}
			res.send('OK');
		});
	});
	
    app.get('/blog', function(req,res) {
		res.g2render('blog');
    });
	app.all(/\/blogPosts\/[0-9]+/, function(req, res) {
		var page = req.path.replace(/[^0-9]/g, '');
		if (page)
			page = parseInt(page);
		post.listBlogPosts('pt', page, null, function (err, posts) {
			if (err) {
				return new BizError(err, ERROR_CODES.BLOG_LIST_POSTS, 'Erro ao buscar posts').sendResponse(req, res);
			}
			res.setHeader('content-type', 'tetx/javascript');
			res.send(posts);
		});
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
				return BizError.notFound(req, res);
			res.g2render('post', {'post': post});
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
		res.g2render('adm/index');
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
