var expect = require('chai').expect;
var RouteOptimizer = require('../../models/route_optimizer.js');

describe('RouteOptimizer', function() {

	describe('#shortest_path()', function() {
		var source = '13206';
		var target = '13693:39169305';
		var cost_multiplier = 1.5;

		it('should return a feature collection', function(done) {
			RouteOptimizer.shortest_path(source, target, cost_multiplier, function(err, output) {
				expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return cost metadata for the route', function(done) {
			RouteOptimizer.shortest_path(source, target, cost_multiplier, function(err, output) {
				expect(output.metadata).to.have.keys('total_cost');
				done();
			});
		});

		it('should return a collection of LineStrings', function(done) {
			RouteOptimizer.shortest_path(source, target, cost_multiplier, function(err, output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.geometry.type).to.equal('LineString');
				done();
			});
		});

		it('should have nonzero coordinates in its geometry', function(done) {
			RouteOptimizer.shortest_path(source, target, cost_multiplier, function(err, output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.geometry.coordinates[0][0]).to.not.equal(0);
				expect(first_feature.geometry.coordinates[0][1]).to.not.equal(0);
				done();
			});
		});

		// This is a shitty test. We need to rigoursly test the shortest path, but this is a substitute for that now.
		it('should have multiple segments in the shortest path from source to target', function(done) {
			RouteOptimizer.shortest_path(source, target, cost_multiplier, function(err, output) {
				expect(output.feature_collection.features.length).to.be.above(5);
				done();
			});
		});

		it('should inlude the length in meters of each segment in the route', function(done) {
			RouteOptimizer.shortest_path(source, target, cost_multiplier, function(err, output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.properties.length_in_meters).to.be.above(0);
				done();
			});
		});

		it('should include the total cost of the route', function(done) {
			RouteOptimizer.shortest_path(source, target, cost_multiplier, function(err, output) {
				expect(output.metadata.total_cost).to.be.above(0);
				done();
			});
		});

		// Yet another shitty test.
		it('should find multiple shortest paths from a single source to multiple targets', function(done) {
			var source_id = '13206';
			var target_ids = '13693:39169305,13344:36791651,3887:478586';
			RouteOptimizer.shortest_path(source_id, target_ids, cost_multiplier, function(err, output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.geometry).to.have.property('type', 'LineString');
				done();
			});
		});

	});

});