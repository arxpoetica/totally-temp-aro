var expect = require('chai').expect;
var pg = require('pg');
var SplicePoint = require('../../models/splice_point.js');

describe('SplicePoint', function() {

	describe('#find_by_carrier()', function() {
		var con_string = 'postgres://aro:aro@localhost/aro';
		var carrier_name = 'VERIZON';

		it('should return a GeoJSON FeatureCollection', function(done) {
			SplicePoint.find_by_carrier(pg, con_string, carrier_name, function(output) {
				expect(output).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return more than one Feature', function(done) {
			SplicePoint.find_by_carrier(pg, con_string, carrier_name, function(output) {
				expect(output.features).to.have.length.above(0);
				done();
			});
		});

		it('should have a geometry feature which includes an array of Points', function(done) {
			SplicePoint.find_by_carrier(pg, con_string, carrier_name, function(output) {
				var first_feature = output.features[0];
				expect(first_feature.geometry.type).to.equal('Point');
				done();
			});
		});

		it('should have an icon', function(done) {
			SplicePoint.find_by_carrier(pg, con_string, carrier_name, function(output) {
				var first_feature = output.features[0];
				expect(first_feature.properties.icon).to.equal('splice_point.png');
				done();
			});
		});
	});

});

				
				