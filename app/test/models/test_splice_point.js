var expect = require('chai').expect;
var pg = require('pg');
var SplicePoint = require('../../models/splice_point.js');

describe('SplicePoint', function() {

	describe('#find_by_carrier()', function() {
		var con_string = 'postgres://aro:aro@localhost/aro';
		var carrier_name = 'VERIZON';

		it('should return a GeoJSON FeatureCollection', function(done) {
			SplicePoint.find_by_carrier(pg, con_string, carrier_name, function(output) {
				expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return more than one Feature', function(done) {
			SplicePoint.find_by_carrier(pg, con_string, carrier_name, function(output) {
				expect(output.feature_collection.features).to.have.length.above(0);
				done();
			});
		});

		it('should have a geometry feature which includes an array of Points', function(done) {
			SplicePoint.find_by_carrier(pg, con_string, carrier_name, function(output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.geometry.type).to.equal('Point');
				done();
			});
		});

		it('should have an id', function(done) {
			SplicePoint.find_by_carrier(pg, con_string, carrier_name, function(output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.properties.id).to.be.above(0);
				done();
			});
		});

		it('should have an icon', function(done) {
			SplicePoint.find_by_carrier(pg, con_string, carrier_name, function(output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.properties.icon).to.equal('splice_point.png');
				done();
			});
		});
	});

	describe('#get_closest_vertex()', function() {
		var con_string = 'postgres://aro:aro@localhost/aro';

		it('should return the id of the closest vertex in the graph', function(done) {
			SplicePoint.get_closest_vertex(pg, con_string, 1738, function(output) {
				expect(output.vertex_id).to.equal('66586');
				done();
			});
		});
	});

});

				
				