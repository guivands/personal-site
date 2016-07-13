//dependencias
var dirTree = require('./package/dir_tree/functions');
var post = require('./package/post/functions');
var i18n = require('./package/i18n/lang.js');

//configuracao de paginas do site
var config = function(app, pool) {
	//seta o pool de conexoes para utilizacao nas diferentes funcionalidades do sistema
    dirTree.setPool(pool);
    post.setPool(pool);

    //app.all('/*', redirectConfig.redirect);

    app.get('/', function(req,res) {
      res.render('index');
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
    app.post('/addTreeNode', isLoggedIn, dirTree.addTreeNode);
    // Chamada assincrona de remocao de diretorio
    app.post('/removeTreeNode', isLoggedIn, dirTree.removeTreeNode);
    // Chamada assincrona de JSON da arvore completa de diretorios
    app.all('/fullDirectoryTree', dirTree.fullDirectoryTree);
    // Locales disponiveis na estrutura de diretorios
    app.all('/dirAvailableLocales', dirTree.availableLocales);
    // Busca conteudo de um diretorio
    app.all('/dirContent', dirTree.getDirectoryContent);
	

	app.all('/admin/', isLoggedIn, function(req, res){
		res.g2render('adm/index', {'fadeMenu':false});
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
    // Retornar post e mostrar em tela
    app.all('/post/*', post.findPost);
}

module.exports.config = config;
