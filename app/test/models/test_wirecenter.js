var expect = require('chai').expect;
var Wirecenter = require('../../models/wirecenter.js');

describe('Wirecenter', function() {

	describe('#find_by_wirecenter_code()', function() {
		var wirecenter_code = 'NYCMNY79';

		it('should return the id of the wirecenter', function(done) {
			Wirecenter.find_by_wirecenter_code(wirecenter_code, function(err, output) {
				var wirecenter = output[0];
				expect(wirecenter.id).to.equal(117);
				done();
			});
		});

		it('should return a MultiPolygon geometry', function(done) {
			Wirecenter.find_by_wirecenter_code(wirecenter_code, function(err, output) {
				var wirecenter = output[0];
				expect(wirecenter.geom.type).to.equal('MultiPolygon');
				done();
			});
		});

		it('should return a centroid with a lat lon pair', function(done) {
			Wirecenter.find_by_wirecenter_code(wirecenter_code, function(err, output) {
				var wirecenter = output[0];
				expect(wirecenter.centroid.type).to.equal('Point');
				expect(wirecenter.centroid.coordinates.length).to.equal(2);
				done();
			});
		});

	});

});