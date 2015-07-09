var expect = require('chai').expect;
var pg = require('pg');
var RouteOptimizer = require('../../models/route_optimizer.js');

describe('RouteOptimizer', function() {

	describe('#shortest_path()', function() {
		var con_string = 'postgres://aro:aro@localhost/aro';
		var source = 173;
		var target = 12810;

		it('should return a GeoJSON FeatureCollection', function(done) {
			RouteOptimizer.shortest_path(pg, con_string, source, target, function(output) {
				expect(output).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return a collection of LineStrings', function(done) {
			RouteOptimizer.shortest_path(pg, con_string, source, target, function(output) {
				var first_feature = output.features[0];
				expect(first_feature.geometry.type).to.equal('LineString');
				done();
			});
		});

		it('should have nonzero coordinates in its geometry', function(done) {
			RouteOptimizer.shortest_path(pg, con_string, source, target, function(output) {
				var first_feature = output.features[0];
				expect(first_feature.geometry.coordinates[0][0]).to.not.equal(0);
				expect(first_feature.geometry.coordinates[0][1]).to.not.equal(0);
				done();
			});
		});

		it('should have a color property', function(done) {
			RouteOptimizer.shortest_path(pg, con_string, source, target, function(output) {
				var first_feature = output.features[0];
				expect(first_feature.properties.color).to.equal('red');
				done();
			});
		});

		// This is a shitty test. We need to rigoursly test the shortest path, but this is a substitute for that now.
		it('should have multiple segments in the shortest path from source to target', function(done) {
			RouteOptimizer.shortest_path(pg, con_string, source, target, function(output) {
				expect(output.features.length).to.be.above(5);
				done();
			});
		});

	});

});