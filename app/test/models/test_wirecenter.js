var expect = require('chai').expect;
var Wirecenter = require('../../models/wirecenter.js');

describe('Wirecenter', function() {

	describe('#find_by_wirecenter_code()', function() {
		var wirecenter_code = 'NYCMNY79';

		it('should return the information of the wirecenter', function(done) {
			Wirecenter.find_by_wirecenter_code(wirecenter_code, function(err, output) {
				expect(output.feature_collection).to.be.an('object');
				expect(output.feature_collection.type).to.be.equal('FeatureCollection');
				expect(output.feature_collection.features).to.be.an('array');
				expect(output.feature_collection.features).to.have.length(1);
				expect(output.feature_collection.features[0].type).to.be.equal('Feature');
				expect(output.feature_collection.features[0].properties).to.be.an('object');
				expect(output.feature_collection.features[0].properties.id).to.be.equal(117);
				expect(output.feature_collection.features[0].properties.name).to.be.equal('NYCMNY79');
				expect(output.feature_collection.features[0].geometry).to.be.an('object');
				expect(output.feature_collection.features[0].geometry.type).to.be.equal('MultiPolygon');
				done();
			});
		});

	});

});