var expect = require('chai').expect;
var models = require('../../models');
var Location = models.Location;

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

		it('should return only businesses', function(done) {
			Location.find_all('businesses', function(err, output) {
				expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
				done();
			});
		});

		it('should return only households', function(done) {
			Location.find_all('households', function(err, output) {
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

	describe('#show_information()', function() {
		var location_id = 1399894; 

		it('should return information of the given location', function(done) {
			Location.show_information(location_id, function(err, output) {
				expect(err).to.not.be.ok;
				expect(output.location_id).to.equal('1399894');
				expect(output.number_of_households).to.equal(23);
				expect(output.number_of_businesses).to.equal(1);
				expect(output.business_install_costs).to.be.above(0);
				expect(output.household_install_costs).to.be.above(0);

				expect(output.customers_businesses_total).to.be.a('number');
				expect(output.customers_households_total).to.be.a('number');
				expect(output.customer_types).to.be.an('array');
				expect(output.customer_types[0]).to.be.an('object');
				expect(output.customer_types[0].name).to.be.a('string');
				expect(output.customer_types[0].households).to.be.a('number');
				expect(output.customer_types[0].businesses).to.be.a('number');

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
				expect(err).to.be.null;
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

		it('should create a commercial location', function(done) {
			values.type = 'commercial';
			values.number_of_employees = 1;
			Location.create_location(values, function(err, output) {
				expect(err).to.be.null;
				expect(output.properties.id).to.not.be.null;
				done();
			});
		});

		it('should create a residential location', function(done) {
			values.type = 'residential';
			values.number_of_households = 1;
			Location.create_location(values, function(err, output) {
				expect(err).to.be.null;
				expect(output.properties.id).to.not.be.null;
				done();
			});
		});

		it('should create a combo location', function(done) {
			values.type = 'combo';
			values.number_of_households = 1;
			values.number_of_employees = 1;
			Location.create_location(values, function(err, output) {
				expect(err).to.be.null;
				expect(output.properties.id).to.not.be.null;
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

		it('should return the annual recurring cost for each business at the location', function(done) {
			Location.show_businesses(location_id, function(err, output) {
				var number_of_businesses = output.length;
				var business_to_check = output[Math.floor(Math.random() * number_of_businesses ) + 0];
				expect(business_to_check.annual_recurring_cost).to.be.above(0);
				done();
			});
		});
	});

	describe('#update_households()', function() {

		it('should update the number of households', function(done) {
			var values = {
				number_of_households: 100,
			};
			Location.update_households(31367, values, function(err, output) {
				expect(!!output).to.be.true;
				done();
			});
		});
	});

	describe('#find_industries()', function() {

		it('should return all the industries', function(done) {
			models.Location.find_industries(function(err, industries) {
				expect(err).to.not.be.ok;
				expect(industries).to.be.an('array');
				expect(industries).to.have.length.above(0);
				var industry = industries[0];
				expect(industry.id).to.be.a('number');
				expect(industry.description).to.be.a('string');
				done();
			});
		});

	});

});

				
				