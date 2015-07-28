var expect = require('chai').expect;
var CensusBlock = require('../../models/census_block.js');

describe('CensusBlock', function() {

	describe('#find_by_statefp_and_county_fp', function() {
		var statefp = '36';
		var countyfp = '061';

		it('should return a feature collection', function(done) {
			CensusBlock.find_by_statefp_and_countyfp(statefp, countyfp, function(err, output) {
				expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return more than one feature', function(done) {
			CensusBlock.find_by_statefp_and_countyfp(statefp, countyfp, function(err, output) {
				expect(output.feature_collection.features).to.have.length.above(0);
				done();
			});
		});

		it('should have a geometry feature which includes an array of MultiPolygons', function(done) {
			CensusBlock.find_by_statefp_and_countyfp(statefp, countyfp, function(err, output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.geometry.type).to.equal('MultiPolygon');
				done();
			});
		});

		it('should have an array of MultiPolygons each with multiple coordinates', function(done) {
			CensusBlock.find_by_statefp_and_countyfp(statefp, countyfp, function(err, output) {
				var first_geom = output.feature_collection.features[0].geometry.coordinates;
				expect(first_geom).to.have.length.above(0);
				done();
			});
		});

	});

});