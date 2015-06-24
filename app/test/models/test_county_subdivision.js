var expect = require('chai').expect;
var pg = require('pg');
var CountySubdivision = require('../../models/county_subdivision.js');

describe('CountySubdivision', function() {

	describe('#find_by_statefp()', function() {
		var con_string = 'postgres://aro:aro@localhost/aro';
		var statefp = '53';

		it('should return a GeoJSON FeatureCollection', function(done) {
			CountySubdivision.find_by_statefp(pg, con_string, statefp, function(output) {
				expect(output).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return more than one Feature', function(done) {
			CountySubdivision.find_by_statefp(pg, con_string, statefp, function(output) {
				expect(output.features).to.have.length.above(0);
				done();
			});
		});

		it('should have a geometry feature which includes an array of MultiPolygons', function(done) {
			CountySubdivision.find_by_statefp(pg, con_string, statefp, function(output) {
				var first_feature = output.features[0];
				expect(first_feature.geometry.type).to.equal('MultiPolygon');
				done();
			});
		});

		it('should have an array of MultiPolygons each with multiple coordinates', function(done) {
			CountySubdivision.find_by_statefp(pg, con_string, statefp, function(output) {
				var first_geom = output.features[0].geometry.coordinates;
				expect(first_geom).to.have.length.above(0);
				done();
			});
		});

	});

});

				
				