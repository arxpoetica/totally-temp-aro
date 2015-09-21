var expect = require('chai').expect;
var CountySubdivision = require('../../models/county_subdivision.js');

describe('CountySubdivision', function() {

	describe('#find_by_statefp()', function() {
		var statefp = '36';

		it('should return a null error', function(done) {
			CountySubdivision.find_by_statefp(statefp, function(err, output) {
				expect(err).to.be.null;
				done();
			});
		});

		it('should return a feature collection', function(done) {
			CountySubdivision.find_by_statefp(statefp, function(err, output) {
				expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return more than one feature', function(done) {
			CountySubdivision.find_by_statefp(statefp, function(err, output) {
				expect(output.feature_collection.features).to.have.length.above(0);
				done();
			});
		});

		it('should have a geometry feature which includes an array of MultiPolygons', function(done) {
			CountySubdivision.find_by_statefp(statefp, function(err, output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.geometry.type).to.equal('MultiPolygon');
				done();
			});
		});

		it('should have an array of MultiPolygons each with multiple coordinates', function(done) {
			CountySubdivision.find_by_statefp(statefp, function(err, output) {
				var first_geom = output.feature_collection.features[0].geometry.coordinates;
				expect(first_geom).to.have.length.above(0);
				done();
			});
		});

		it('should have a name property', function(done) {
			CountySubdivision.find_by_statefp(statefp, function(err, output) {
				expect(output.feature_collection.features[0].properties.name).to.be.a('string');
				done();
			});
		});

		it('should have an id property', function(done) {
			CountySubdivision.find_by_statefp(statefp, function(err, output) {
				expect(output.feature_collection.features[0].properties.id).to.be.a('number');
				done();
			});
		});


	});

});
