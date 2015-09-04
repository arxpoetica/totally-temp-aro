var expect = require('chai').expect;
var NetworkPlan = require('../../models/network_plan.js');
var RouteOptimizer = require('../../models/route_optimizer.js');
var Network = require('../../models/network.js');

describe('Network', function() {

	describe('#view_fiber_plant_for_carrier()', function() {
		var carrier_name = 'VERIZON';

		it('should return a feature collection', function(done) {
			Network.view_fiber_plant_for_carrier(carrier_name, function(err, output) {
				expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return more than one feature', function(done) {
			Network.view_fiber_plant_for_carrier(carrier_name, function(err, output) {
				expect(output.feature_collection.features).to.have.length.above(0);
				done();
			});
		});

		it('should have a geometry feature which includes an array of LineStrings', function(done) {
			Network.view_fiber_plant_for_carrier(carrier_name, function(err, output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.geometry.type).to.equal('LineString');
				done();
			});
		});

		it('should have an array of LineStrings each with multiple coordinates', function(done) {
			Network.view_fiber_plant_for_carrier(carrier_name, function(err, output) {
				var first_geom = output.feature_collection.features[0].geometry.coordinates;
				expect(first_geom).to.have.length.above(0);
				done();
			});
		});

	});

	describe('#view_network_nodes()', function() {
		var node_type = 'central_office';

		it('should return a feature collection', function(done) {
			Network.view_network_nodes(node_type, null, function(err, output) {
				expect(err).to.be.null;
				expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return more than one feature', function(done) {
			Network.view_network_nodes(node_type, null, function(err, output) {
				expect(output.feature_collection.features).to.have.length.above(0);
				done();
			});
		});

		it('should have a geometry feature which includes an array of Points', function(done) {
			Network.view_network_nodes(node_type, null, function(err, output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.geometry.type).to.equal('Point');
				done();
			});
		});

		it('should return a node id in its properties', function(done) {
			Network.view_network_nodes(node_type, null, function(err, output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.properties.id).to.be.above(0);
				done();
			});
		});

		it('should have an array of Points each with multiple coordinates', function(done) {
			Network.view_network_nodes(node_type, null, function(err, output) {
				var first_geom = output.feature_collection.features[0].geometry.coordinates;
				expect(first_geom).to.have.length.above(0);
				done();
			});
		});
	});

	describe('#view_network_node_types()', function() {
		it('should return all available network node types', function(done) {
			Network.view_network_node_types(function(err, output) {
				expect(err).to.be.null;
				expect(output.length).to.be.above(0);
				expect(output[0]).to.have.property('id');
				expect(output[0]).to.have.property('name');
				expect(output[0]).to.have.property('description');
				done();
			});
		});
	});

	describe('#edit_network_nodes() and #clear_network_nodes()', function() {
		var route_id;
		var nodes;

		before(function(done) {
			var area = {
				name: 'Boston, MA, USA',
				centroid: {
					lat: 42.3600825,
					lng: -71.0588801,
				},
				bounds: {
					northeast: {
						lat: 42.3988669,
						lng: -70.9232011,
					},
					southwest: {
						lat: 42.22788,
						lng: -71.191113,
					}
				},
			};
			NetworkPlan.create_route('Untitled route', area, function(err, route) {
				expect(route).to.have.property('id');
				expect(route).to.have.property('name');
				route_id = route.id;
				done();
			});
		});

		it('should count the network nodes not associated to a route', function(done) {
			Network.view_network_nodes(null, null, function(err, output) {
				expect(err).to.be.null;
				nodes = output.feature_collection.features.length;
				done();
			});
		});

		it('should not fail with empty changes', function(done) {
			var changes = {};
			Network.edit_network_nodes(route_id, changes, function(err, output) {
				expect(err).to.not.exist;
				done();
			});
		});

		it('should add new network nodes', function(done) {
			var changes = {
				insertions: [
					{
						lat: 40.7752768348037,
						lon: -73.9540386199951,
						type: 2,
					}
				],
			};
			Network.edit_network_nodes(route_id, changes, function(err, output) {
				expect(err).to.be.null;
				done();
			});
		});

		it('should count the network nodes associated to our route', function(done) {
			Network.view_network_nodes(null, route_id, function(err, output) {
				expect(err).to.be.null;
				var diff = output.feature_collection.features.length - nodes;
				expect(diff).to.be.equal(1);
				done();
			});
		});

		it('should calculate the cost of new network nodes', function(done) {
			RouteOptimizer.calculate_equipment_nodes_cost(route_id, function(err, output) {
				expect(err).to.not.be.ok;
				expect(output.equipment_node_types).to.be.an('array');
				expect(output.total).to.be.a('number');
				done();
			});
		});

		it('should clear the network nodes in a route', function(done) {
			Network.clear_network_nodes(route_id, function(err, output) {
				expect(err).to.be.null;

				Network.view_network_nodes(null, route_id, function(err, output) {
					expect(err).to.be.null;
					var diff = output.feature_collection.features.length - nodes;
					expect(diff).to.be.equal(0);
					done();
				});
			});
		});

	});

});