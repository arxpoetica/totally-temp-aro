var expect = require('chai').expect;
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

	describe('#view_network_nodes_by_type()', function() {
		var node_type = 'central_office';

		it('should return a feature collection', function(done) {
			Network.view_network_nodes_by_type(node_type, function(err, output) {
				expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return more than one feature', function(done) {
			Network.view_network_nodes_by_type(node_type, function(err, output) {
				expect(output.feature_collection.features).to.have.length.above(0);
				done();
			});
		});

		it('should have a geometry feature which includes an array of Points', function(done) {
			Network.view_network_nodes_by_type(node_type, function(err, output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.geometry.type).to.equal('Point');
				done();
			});
		});

		it('should return a node id in its properties', function(done) {
			Network.view_network_nodes_by_type(node_type, function(err, output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.properties.id).to.be.above(0);
				done();
			});
		});

		it('should have an array of Points each with multiple coordinates', function(done) {
			Network.view_network_nodes_by_type(node_type, function(err, output) {
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

});