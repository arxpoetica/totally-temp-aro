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

exports.execute = function(sql, params, callback) {
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
			callback(null, result.rowCount);
		})
	})
}

exports.findOne = function(sql, params, def, callback) {
	if (arguments.length === 3) {
		callback = def;
		def = void 0;
	}
	if (arguments.length === 2) {
		callback = params;
		params = [];
		def = void 0;
	}
	txain(function(callback) {
		exports.query(sql, params, callback)
	})
	.then(function(rows, callback) {
		callback(null, rows[0] || def)
	})
	.end(callback);
}
