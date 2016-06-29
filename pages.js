var dirTree = require('./package/dir_tree/functions');
var post = require('./package/post/functions');
var i18n = require('./package/i18n/lang.js');

var config = function(app, pool) {
    dirTree.setPool(pool);
    post.setPool(pool);

    //app.all('/*', redirectConfig.redirect);

    app.get('/', function(req,res) {
      res.render('index')
    });

    app.get('/directoryTree', function(req,res) {
      res.render('directoryTree');
    });

    app.post('/addTreeNode', dirTree.addTreeNode);
    app.post('/removeTreeNode', dirTree.removeTreeNode);
    app.all('/fullDirectoryTree', dirTree.fullDirectoryTree);
    app.all('/dirAvailableLocales', dirTree.availableLocales);


    app.get('/createPost', function(req,res){
      res.render('createPost');
    });

    app.post('/addPost', function(req,res){
      post.addPost(req, res);
    });

    app.all('/post/*', post.findPost);

    app.all(/^\/[a-z]{2}\/.+/, function(req, res) {
      var lang = i18n.resolve(req.path);
      res.render('testPage', {'i18n':lang});
    });
}

module.exports.config = config;
