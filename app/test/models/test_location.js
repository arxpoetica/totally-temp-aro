var expect = require('chai').expect;
var Location = require('../../models/location.js');

describe('Location', function() {

	describe('#find_all()', function() {

		it('should return a null error', function(done) {
			Location.find_all(function(err, output) {
				expect(err).to.be.null;
				done();
			});
		});

		it('should return a GeoJSON FeatureCollection', function(done) {
			Location.find_all(function(err, output) {
				expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return more than one Feature', function(done) {
			Location.find_all(function(err, output) {
				expect(output.feature_collection.features).to.have.length.above(0);
				done();
			});
		});

		it('should have a geometry feature which includes an array of Points', function(done) {
			Location.find_all(function(err, output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.geometry.type).to.equal('Point');
				done();
			});
		});

		it('should have an id', function(done) {
			Location.find_all(function(err, output) {
				var first_feature = output.feature_collection.features[0];
				expect(first_feature.properties.id).to.be.above(0);
				done();
			});
		});

	});

	describe('#get_closest_vertex()', function() {

		it('should return the id of the closest vertex in the graph', function(done) {
			Location.get_closest_vertex(3756, function(err, output) {
				expect(output.vertex_id).to.equal('7749');
				done();
			});
		});
	});

	describe('#get_households()', function() {

		it('should return the location id passed in', function(done) {
			Location.get_households(1399894, function(err, output) {
				expect(output.location_id).to.equal('1399894');
				done();
			});
		});

		it('should return the number of households', function(done) {
			Location.get_households(1399894, function(err, output) {
				expect(output.number_of_households).to.equal(23);
				done();
			});
		});

		it('should return the install cost per household', function(done) {
			Location.get_households(1399894, function(err, output) {
				expect(output.install_cost_per_hh).to.be.null; // Because we have no data for install costs yet
				done();
			});
		});

		it('should return the annual recurring costs per household', function(done) {
			Location.get_households(1399894, function(err, output) {
				expect(output.annual_recurring_cost_per_hh).to.be.null; // Because we have no data for install costs yet
				done();
			});
		});
	});

	describe('#create_location()', function() {
		var values = {
			address: '134 Guernsey St',
			lat: '40.725449',
			lon: '-73.953771',
			city: 'Brooklyn',
			state: 'NY',
			zipcode: '11222'
		};

		it('should create a location and give it an id', function(done) {
			Location.create_location(values, function(err, output) {
				expect(output.properties.id).to.not.be.null;
				done();
			});
		});

		it('should create a location of type Feature', function(done) {
			Location.create_location(values, function(err, output) {
				expect(output.type).to.equal('Feature');
				done();
			});
		});

		it('should create a location which has a Point geometry', function(done) {
			Location.create_location(values, function(err, output) {
				expect(output.geometry.type).to.equal('Point');
				done();
			});
		});

		// For some reason, this function reverses lat and lon from the input values when it saves...
		it('should create a location which has a Point geometry with lat & lon coordinates matching the input values', function(done) {
			Location.create_location(values, function(err, output) {
				var lat = String(output.geometry.coordinates[0]);
				var lon = String(output.geometry.coordinates[1]);

				// Confusing...
				expect(lat).to.equal(values.lon);
				expect(lon).to.equal(values.lat);
				done();
			});
		});

	});
	
	describe('#show_businesses()', function(done) {
		var location_id = 31367;

		it('should return a list of all the businesses at the location', function(done) {
			Location.show_businesses(location_id, function(err, output) {
				expect(output.length).to.equal(4);
				done();
			});
		});

		it('should return the id of each business at the location', function(done) {
			Location.show_businesses(location_id, function(err, output) {
				var number_of_businesses = output.length;
				var business_to_check = output[Math.floor(Math.random() * number_of_businesses ) + 0];
				expect(business_to_check.id).to.not.be.null;
				done();
			});
		});

		it('should return the industry id of each business at the location', function(done) {
			Location.show_businesses(location_id, function(err, output) {
				var number_of_businesses = output.length;
				var business_to_check = output[Math.floor(Math.random() * number_of_businesses ) + 0];
				expect(business_to_check.industry_id).to.not.be.null;
				done();
			});
		});

		it('should return the name of each business at the location', function(done) {
			Location.show_businesses(location_id, function(err, output) {
				var business_to_check = output[0];
				expect(business_to_check.name).to.not.be.null;
				done();
			});
		});

		it('should return the number of employees at each business at the location', function(done) {
			Location.show_businesses(location_id, function(err, output) {
				var number_of_businesses = output.length;
				var business_to_check = output[Math.floor(Math.random() * number_of_businesses ) + 0];
				expect(business_to_check.number_of_employees).to.be.above(0);
				done();
			});
		});

		it('should return the install cost for each business at the location', function(done) {
			Location.show_businesses(location_id, function(err, output) {
				var number_of_businesses = output.length;
				var business_to_check = output[Math.floor(Math.random() * number_of_businesses ) + 0];
				expect(business_to_check.install_cost).to.be.above(0);
				done();
			});
		});
	});

});

				
				