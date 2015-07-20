var expect = require('chai').expect;
var pg = require('pg');
var Location = require('../../models/location.js');

describe('Location', function() {

	describe('#find_all()', function() {
		var con_string = 'postgres://aro:aro@localhost/aro';

		it('should return a GeoJSON FeatureCollection', function(done) {
			Location.find_all(pg, con_string, function(output) {
				expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return more than one Feature', function(done) {
			Location.find_all(pg, con_string, function(output) {
				expect(output.feature_collection.features).to.have.length.above(0);
				done();
			});
		});

		it('should have a geometry feature which includes an array of Points', function(done) {
			Location.find_all(pg, con_string, function(output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.geometry.type).to.equal('Point');
				done();
			});
		});

		it('should have an id', function(done) {
			Location.find_all(pg, con_string, function(output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.properties.id).to.be.above(0);
				done();
			});
		});

		it('should have an icon', function(done) {
			Location.find_all(pg, con_string, function(output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.properties.icon).to.equal('location_business_gray.png');
				done();
			});
		});
	});

	describe('#get_closest_vertex()', function() {
		var con_string = 'postgres://aro:aro@localhost/aro';

		it('should return the id of the closest vertex in the graph', function(done) {
			Location.get_closest_vertex(pg, con_string, 199451191, function(output) {
				expect(output.vertex_id).to.equal('145517');
				done();
			});
		});
	});

	describe('#total_service_cost()', function() {
		var con_string = 'postgres://aro:aro@localhost/aro';

		it('should return the cost of entering the location', function(done) {
			Location.total_service_cost(pg, con_string, 199451191, function(output) {
				expect(output).to.have.keys('entry_fee', 'total_install_costs');
				done();
			});
		});
	});

});

				
				