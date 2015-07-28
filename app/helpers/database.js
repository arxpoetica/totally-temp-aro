var pg = require('pg');
var con_string = process.env.DATABASE_URL || 'postgres://aro:aro@localhost/aro';
var txain = require('txain');
var _ = require('underscore')

function processQuery(sql, params) {
	var length = params.length;
	var replacements = [];
	for (var i = 0, n = 0; i < params.length; i++) {
		var value = params[i]
		if (_.isArray(value)) {
			var placeholders = value.map(function(val) {
				return '$x'+(++n);
			}).join(',');
			replacements.push(['\\$'+(i+1), placeholders]);
		} else {
			replacements.push(['\\$'+(i+1), '$x'+(n+1)]);
			n++;
		}
	};
	replacements.forEach(function(arr) {
		sql = sql.replace(new RegExp(arr[0], 'g'), arr[1]);
	})
	sql = sql.replace(/\$x/g, '\$');
	var flatten = _.flatten(params);
	Array.prototype.splice.apply(params, [0, params.length].concat(flatten));
	return sql;
}

exports.query = function(sql, params, callback) {
	if (arguments.length === 2) {
		callback = params;
		params = [];
	}
	pg.connect(con_string, function(err, client, done) {
		if (err) return callback(err);
		sql = processQuery(sql, params);
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
		sql = processQuery(sql, params);
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
