var expect = require('chai').expect;
var pg = require('pg');
var RouteOptimizer = require('../../models/route_optimizer.js');

describe('RouteOptimizer', function() {

	describe('#shortest_path()', function() {
		var con_string = 'postgres://aro:aro@localhost/aro';
		var source = 13206;
		var target = 66457;
		var cost_multiplier = 1.5;

		it('should return a feature collection', function(done) {
			RouteOptimizer.shortest_path(pg, con_string, source, target, cost_multiplier, function(output) {
				expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return cost metadata for the route', function(done) {
			RouteOptimizer.shortest_path(pg, con_string, source, target, cost_multiplier, function(output) {
				expect(output.metadata).to.have.keys('total_cost');
				done();
			});
		});

		it('should return a collection of LineStrings', function(done) {
			RouteOptimizer.shortest_path(pg, con_string, source, target, cost_multiplier, function(output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.geometry.type).to.equal('LineString');
				done();
			});
		});

		it('should have nonzero coordinates in its geometry', function(done) {
			RouteOptimizer.shortest_path(pg, con_string, source, target, cost_multiplier, function(output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.geometry.coordinates[0][0]).to.not.equal(0);
				expect(first_feature.geometry.coordinates[0][1]).to.not.equal(0);
				done();
			});
		});

		// This is a shitty test. We need to rigoursly test the shortest path, but this is a substitute for that now.
		it('should have multiple segments in the shortest path from source to target', function(done) {
			RouteOptimizer.shortest_path(pg, con_string, source, target, cost_multiplier, function(output) {
				expect(output.feature_collection.features.length).to.be.above(5);
				done();
			});
		});

		it('should inlude the length in meters of each segment in the route', function(done) {
			RouteOptimizer.shortest_path(pg, con_string, source, target, cost_multiplier, function(output) {
				first_feature = output.feature_collection.features[0];
				expect(first_feature.properties.length_in_meters).to.equal(0.425293090686502);
				done();
			});
		});

		it('should inlude the total cost of the route', function(done) {
			RouteOptimizer.shortest_path(pg, con_string, source, target, cost_multiplier, function(output) {
				expect(output.metadata.total_cost).to.equal(6254.525397530297);
				done();
			});
		});

	});

});