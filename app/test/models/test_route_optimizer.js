var expect = require('chai').expect;
var RouteOptimizer = require('../../models/route_optimizer.js');

describe('RouteOptimizer', function() {

	describe('#shortest_path()', function() {
		var source = '1';
		var target = '40103873';
		var cost_multiplier = 1.5;
		var route_id;

		it('should create a new empty route', function(done) {
			RouteOptimizer.create_route('Untitled route', function(err, route) {
				expect(route).to.have.property('id');
				expect(route).to.have.property('name');
				route_id = route.id;
				done();
			});
		});

		it('should should find all routes', function(done) {
			RouteOptimizer.find_all(function(err, routes) {
				expect(routes.length > 0).to.equal(true);
				var route = routes[0];
				expect(route).to.have.property('id');
				expect(route).to.have.property('name');
				done();
			});
		});

		it('should edit basic properties of an existing routes', function(done) {
			var data = {
				name: 'Other name',
			};
			RouteOptimizer.save_route(route_id, data, function(err, output) {
				expect(!!output).to.be.equal(true);
				done();
			});
		});

		it('should edit the sources and targets of an existing route', function(done) {
			var changes = {
				insertions: {
					locations: [target],
					network_nodes: [source],
				},
			};
			RouteOptimizer.edit_route(route_id, changes, function(err, route) {
				expect(route).to.have.property('metadata');
				expect(route).to.have.property('feature_collection');
				expect(route.feature_collection).to.have.property('type', 'FeatureCollection');
				expect(route.feature_collection.features.length > 0).to.be.equal(true);
				done();
			});
		});

		it('should return the information of an existing route', function(done) {
			RouteOptimizer.find_route(route_id, function(err, route) {
				expect(route).to.have.property('metadata');
				expect(route.metadata.total_cost).to.be.a('number');
				expect(route.metadata.fiber_cost).to.be.a('number');
				expect(route.metadata.locations_cost).to.be.a('number');
				expect(route.metadata.customers_total).to.be.a('number');
				expect(route.metadata.customer_types).to.be.an('array');
				expect(route.metadata.customer_types[0]).to.be.an('object');
				expect(route.metadata.customer_types[0].name).to.be.a('string');
				expect(route.metadata.customer_types[0].total).to.be.a('number');
				expect(route.metadata).to.have.property('total_cost');
				expect(route.metadata).to.have.property('fiber_cost');
				expect(route.metadata).to.have.property('locations_cost');
				
				var year = new Date().getFullYear();
				expect(route.metadata.npv).to.be.an('array');
				expect(route.metadata.npv).to.have.length(5);
				expect(route.metadata.npv[0].year).to.be.a('number');
				expect(route.metadata.npv[0].year).to.be.equal(year+1);
				expect(route.metadata.npv[0].value).to.be.a('number');

				expect(route).to.have.property('feature_collection');
				expect(route.feature_collection).to.have.property('type', 'FeatureCollection');
				expect(route.feature_collection.features.length > 0).to.be.equal(true);
				done();
			});
		});

		it('should delete the sources and targets of an existing route', function(done) {
			var changes = {
				deletions: {
					locations: [target],
					network_nodes: [source],
				},
			};
			RouteOptimizer.edit_route(route_id, changes, function(err, route) {
				expect(route).to.have.property('metadata');
				expect(route).to.have.property('feature_collection');
				expect(route.feature_collection).to.have.property('type', 'FeatureCollection');
				expect(route.feature_collection.features.length).to.be.equal(0);
				done();
			});
		});

		it('should delete all the information of an existing route', function(done) {
			RouteOptimizer.clear_route(route_id, function(err) {
				expect(err).to.be.null;
				done();
			});
		});

		it('should delete an existing route', function(done) {
			RouteOptimizer.delete_route(route_id, function(err, output) {
				expect(!!output).to.be.equal(true);
				done();
			});
		});

	});

});