var models = require('../../models');
var txain = require('txain');
var _ = require('underscore');

var app = require('../../app');
var passport_stub = require('passport-stub');
passport_stub.install(app);

var test_user = null;

exports.request = require('supertest')(app);
exports.agent = require('supertest').agent(app);

exports.create_test_user = function(callback) {
	if (test_user) return callback(null, test_user);

	var email = 'test@example.com';
	var password = '#test$';
	txain(function(callback) {
		models.User.find_by_email(email, callback);
	})
	.then(function(user, callback) {
		if (user) return callback(null, user);
		var data = { first_name: 'test', last_name: 'test', email: email, password: password };
		models.User.register(data, callback);
	})
	.then(function(user, callback) {
		exports.test_user = test_user = user;
		callback(null, user);
	})
	.end(callback);
}

exports.create_test_user(function(err, user) {
	exports.login_app();
	global.run && run(); // mocha `run()` method
});

exports.login_app = function(user) {
	passport_stub.login(user || test_user);
}

exports.logout_app = function() {
	passport_stub.logout();
}

exports.test_viewport = function(obj) {
	return _.extend(obj || {}, {
		nelat: '40.805607996143685',
		nelon: '-73.91296976252443',
		swlat: '40.69962581648302',
		swlon: '-74.06883829279786',
		zoom: '13',
		threshold: '10',
	})
}
