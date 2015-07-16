var pg = require('pg');
var con_string = process.env.DATABASE_URL || 'postgres://aro:aro@localhost/aro';
var txain = require('txain');

exports.query = function(sql, params, callback) {
	if (arguments.length === 2) {
		callback = params;
		params = [];
	}
	pg.connect(con_string, function(err, client, done) {
		if (err) return callback(err);
		client.query(sql, params, function(err, result) {
			if (err) console.log('sql failed', sql, params)
			done();
			if (err) return callback(err);
			callback(null, result.rows);
		})
	})
}

exports.findOne = function(sql, params, callback) {
	if (arguments.length === 2) {
		callback = params;
		params = [];
	}
	txain(function(callback) {
		exports.query(sql, params, callback)
	})
	.then(function(rows, callback) {
		callback(null, rows[0])
	})
	.end(callback);
}
