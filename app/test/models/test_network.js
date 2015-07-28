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
});