var expect = require('chai').expect;
var pg = require('pg');
var RoadSegment = require('../../models/road_segment.js');

describe('RoadSegment', function() {

	describe('#find_by_countyfp()', function() {
		var con_string = 'postgres://aro:aro@localhost/aro';
		var countyfp = '033';

		it('should return a GeoJSON FeatureCollection', function(done) {
			RoadSegment.find_by_countyfp(pg, con_string, countyfp, function(output) {
				expect(output).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return more than one Feature', function(done) {
			RoadSegment.find_by_countyfp(pg, con_string, countyfp, function(output) {
				expect(output.features).to.have.length.above(0);
				done();
			});
		});

		it('should have a geometry feature which includes an array of MultiPolygons', function(done) {
			RoadSegment.find_by_countyfp(pg, con_string, countyfp, function(output) {
				var first_feature = output.features[0];
				expect(first_feature.geometry.type).to.equal('MultiLineString');
				done();
			});
		});

		it('should have an array of MultiPolygons each with multiple coordinates', function(done) {
			RoadSegment.find_by_countyfp(pg, con_string, countyfp, function(output) {
				var first_geom = output.features[0].geometry.coordinates;
				expect(first_geom).to.have.length.above(0);
				done();
			});
		});

	});

});

				
				