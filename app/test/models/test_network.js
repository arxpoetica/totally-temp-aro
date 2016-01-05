var expect = require('chai').expect;
var models = require('../../models');
var NetworkPlan = models.NetworkPlan;
var RouteOptimizer = models.RouteOptimizer;
var Network = models.Network;
var test_utils = require('./test_utils');
var request = test_utils.request;

describe('Network', function() {

	describe('#view_fiber_plant_for_carrier()', function() {
		var carrier_name = 'VERIZON';

		it('should return a feature collection', function(done) {
			request
				.get('/network/fiber_plant/'+carrier_name)
				.query(test_utils.test_viewport())
				.accept('application/json')
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(res.statusCode).to.be.equal(200);
					expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
					expect(output.feature_collection.features).to.have.length.above(0);

					var first_feature = output.feature_collection.features[0];
					expect(first_feature.geometry.type).to.equal('LineString');
					expect(first_feature.geometry.coordinates).to.have.length.above(0);
					done();
			});
		});

	});

	describe('#view_network_nodes()', function() {
		var node_type = 'central_office';

		it('should return a feature collection', function(done) {
			request
				.get('/network/nodes/'+node_type)
				.accept('application/json')
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
					expect(output.feature_collection.features).to.have.length.above(0);

					var first_feature = output.feature_collection.features[0];
					expect(first_feature.geometry.type).to.equal('Point');
					expect(first_feature.geometry.coordinates).to.have.length.above(0);
					expect(first_feature.properties.id).to.be.a('number');
					done();
			});
		});
	});

	describe('#view_network_node_types()', function() {
		it('should return all available network node types', function(done) {
			request
				.get('/network/nodes')
				.accept('application/json')
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(output.length).to.be.above(0);
					expect(output[0]).to.have.property('id');
					expect(output[0]).to.have.property('name');
					expect(output[0]).to.have.property('description');
					done();
			});
		});
	});

	describe('#carriers()', function() {
		it('should return all carriers', function(done) {
			request
				.get('/network/carriers/1') // TODO: should test an existing plan
				.accept('application/json')
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(res.statusCode).to.be.equal(200);
					expect(output.length).to.be.equal(0);
					// expect(output.length).to.be.above(0);
					// expect(output[0]).to.be.an('object');
					// expect(output[0].id).to.be.a('number');
					// expect(output[0].name).to.be.a('string');
					// expect(output[0].color).to.be.a('string');
					done();
			});
		});
	});

	describe('#edit_network_nodes() and #clear_network_nodes()', function() {
		var plan_id;
		var nodes;
		var node_id;

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
			NetworkPlan.create_plan('Untitled plan', area, test_utils.test_user, function(err, plan) {
				expect(plan).to.have.property('id');
				expect(plan).to.have.property('name');
				plan_id = plan.id;
				done();
			});
		});

		it('should count the network nodes not associated to a plan', function(done) {
			Network.view_network_nodes(null, null, function(err, output) {
				expect(err).to.be.null;
				nodes = output.feature_collection.features.length;
				done();
			});
		});

		it('should not fail with empty changes', function(done) {
			request
				.post('/network/nodes/'+plan_id+'/edit')
				.accept('application/json')
				.send({})
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(res.statusCode).to.be.equal(200);
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
			request
				.post('/network/nodes/'+plan_id+'/edit')
				.accept('application/json')
				.send(changes)
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(res.statusCode).to.be.equal(200);

					Network.view_network_nodes(null, plan_id, function(err, output) {
						expect(err).to.be.null;
						var diff = output.feature_collection.features.length - nodes;
						expect(diff).to.be.equal(1);
						done();
					});
			});
		});

		it('should calculate the cost of new network nodes', function(done) {
			RouteOptimizer.calculate_equipment_nodes_cost(plan_id, function(err, output) {
				expect(err).to.not.be.ok;
				expect(output.equipment_node_types).to.be.an('array');
				expect(output.total).to.be.a('number');
				done();
			});
		});

		it('should return network nodes of a type', function(done) {
			request
				.get('/network/nodes/'+plan_id+'/find')
				.accept('application/json')
				.query({ node_types: 'splice_point' })
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(output.feature_collection.features).to.be.an('array');
					expect(output.feature_collection.features).to.have.length(1);
					node_id = output.feature_collection.features[0].properties.id;
					done();
			});
		});

		it('should edit network nodes', function(done) {
			var changes = {
				updates: [
					{
						lat: 40.7752768348037,
						lon: -73.9540386199951,
						type: 2,
						id: node_id,
					}
				],
			};
			request
				.post('/network/nodes/'+plan_id+'/edit')
				.accept('application/json')
				.send(changes)
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(res.statusCode).to.be.equal(200);
					done();
			});
		});

		it('should add another network node', function(done) {
			var changes = {
				insertions: [
					{
						lat: 40.7752768348037,
						lon: -73.9540386199951,
						type: 2,
					}
				],
			};
			request
				.post('/network/nodes/'+plan_id+'/edit')
				.accept('application/json')
				.send(changes)
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(res.statusCode).to.be.equal(200);
					done();
			});
		});

		it('should delete network nodes', function(done) {
			var changes = {
				deletions: [
					{
						id: node_id,
					}
				],
			};
			request
				.post('/network/nodes/'+plan_id+'/edit')
				.accept('application/json')
				.send(changes)
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(res.statusCode).to.be.equal(200);
					done();
			});
		});

		it('should clear the network nodes in a plan', function(done) {
			request
				.post('/network/nodes/'+plan_id+'/clear')
				.accept('application/json')
				.end(function(err, res) {
					if (err) return done(err);
					expect(res.statusCode).to.be.equal(200);

					Network.view_network_nodes(null, plan_id, function(err, output) {
						expect(err).to.be.null;
						var diff = output.feature_collection.features.length - nodes;
						expect(diff).to.be.equal(0);
						done();
					});
			});

		});

	});

});
