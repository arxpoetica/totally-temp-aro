var expect = require('chai').expect;
var request = require('./test_utils').request;

describe('CensusBlock', function() {

	describe('#find_by_statefp_and_county_fp', function() {
		var statefp = '36';
		var countyfp = '061';

		it('should return a feature collection', function(done) {
			request
				.get('/census_blocks/'+statefp+'/'+countyfp)
				.accept('application/json')
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(res.statusCode).to.be.equal(200);
					expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
					expect(output.feature_collection.features).to.have.length.above(0);

					var first_feature = output.feature_collection.features[0];
					expect(first_feature.geometry.type).to.equal('MultiPolygon');
					expect(first_feature.geometry.coordinates).to.have.length.above(0);
					done();
				});

		});

	});

});