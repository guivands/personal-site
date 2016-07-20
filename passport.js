var flash = require('connect-flash');
var user = require('./package/user');
var session = require('express-session');

module.exports = function(app, passport, LocalStrategy) {
	// required for passport
	app.use(session({
		secret: 'guilhermegomespersonalsitesk',
		resave: false,
		saveUninitialized: false
	})); // session secret
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session


	passport.use(new LocalStrategy(
		function(username, password, done){
			user.findUser(username, function (err, user){
				if (err)
					done(err, user);
				if (!user || !user.validatePassword(password))
					return done(null, false, {message:'Credenciais invalidas'});
				return done(null, user);
			});
		}
	));


	passport.serializeUser(function(user, done) {
		done(null, user.username);
	});

	passport.deserializeUser(function(user, done) {
		done(null, {'username':user});
	});


	app.post('/login', passport.authenticate('local', {
		successRedirect: '/admin',
		failureRedirect: '/loginForm'
	}));
	
	app.all('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.all('/g2login', function(req, res){
		res.setHeader('content-type','text/html');
		res.render('login');
	});
};

// route middleware to make sure a user is logged in
global.isLoggedIn = function(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
};
