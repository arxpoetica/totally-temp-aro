var expect = require('chai').expect;
var pg = require('pg');
var Location = require('../../models/location.js');

describe('Location', function() {

	describe('#find_all()', function() {
		var con_string = 'postgres://aro:aro@localhost/aro';

		it('should return a GeoJSON FeatureCollection', function(done) {
			Location.find_all(pg, con_string, function(output) {
				expect(output).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

	});

});

				
				