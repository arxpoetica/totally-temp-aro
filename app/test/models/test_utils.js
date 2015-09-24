var models = require('../../models');
var txain = require('txain');

var app = require('../../app');
var passport_stub = require('passport-stub');
passport_stub.install(app);

var test_user = null;

exports.request = require('supertest')(app);

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
		test_user = user;
		callback(null, user);
	})
	.end(callback);
}

exports.create_test_user(function(err, user) {
	exports.login_app();
	run();
});

exports.login_app = function() {
	passport_stub.login(test_user);
}

exports.logout_app = function() {
	passport_stub.logout();
}

