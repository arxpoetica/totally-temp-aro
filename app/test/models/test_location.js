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

		it('should return more than one Feature', function(done) {
			Location.find_all(pg, con_string, function(output) {
				expect(output.features).to.have.length.above(0);
				done();
			});
		});

		it('should have a geometry feature which includes an array of Points', function(done) {
			Location.find_all(pg, con_string, function(output) {
				var first_feature = output.features[0];
				expect(first_feature.geometry.type).to.equal('Point');
				done();
			});
		});

		it('should have an icon', function(done) {
			Location.find_all(pg, con_string, function(output) {
				var first_feature = output.features[0];
				expect(first_feature.properties.icon).to.equal('location_business.png');
				done();
			});
		});

	});

});

				
				