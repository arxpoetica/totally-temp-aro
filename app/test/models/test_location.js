var expect = require('chai').expect;
var test_utils = require('./test_utils');
var request = test_utils.request;

describe('Location', function() {

	describe('#find_all()', function() {

		it('should return a GeoJSON FeatureCollection', function(done) {
			request
				.get('/locations/0')
				.query(test_utils.test_viewport())
				.accept('application/json')
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(res.statusCode).to.be.equal(200);
					expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
					expect(output.feature_collection.features).to.have.length.above(0);

					var first_feature = output.feature_collection.features[0];
					expect(first_feature.geometry.type).to.equal('Point');
					expect(first_feature.properties.id).to.a('number');
					done();
				});
		});

		it('should return only businesses', function(done) {
			request
				.get('/locations/0')
				.query(test_utils.test_viewport({ type: 'business' }))
				.accept('application/json')
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(res.statusCode).to.be.equal(200);
					expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
					expect(output.feature_collection.features).to.have.length.above(0);

					var first_feature = output.feature_collection.features[0];
					expect(first_feature.geometry.type).to.equal('Point');
					expect(first_feature.properties.id).to.a('number');
					done();
				});
		});

		it('should return only households', function(done) {
			request
				.get('/locations/0')
				.query(test_utils.test_viewport({ type: 'households' }))
				.accept('application/json')
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(res.statusCode).to.be.equal(200);
					expect(output.feature_collection).to.have.property('type', 'FeatureCollection');
					expect(output.feature_collection.features).to.have.length.above(0);

					var first_feature = output.feature_collection.features[0];
					expect(first_feature.geometry.type).to.equal('Point');
					expect(first_feature.properties.id).to.a('number');
					done();
				});
		});

	});

	describe('#show_information()', function() {
		var location_id = 1399894;

		it('should return information of the given location', function(done) {
			request
				.get('/locations/'+location_id+'/show')
				.query({ type: 'households' })
				.accept('application/json')
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(res.statusCode).to.be.equal(200);
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
			lat: 40.725449,
			lon: -73.953771,
			city: 'Brooklyn',
			state: 'NY',
			zipcode: '11222'
		};

		function create_location(values, done) {
			request
				.post('/locations/create')
				.send(values)
				.accept('application/json')
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(res.statusCode).to.be.equal(200);
					expect(output.properties.id).to.not.be.null;
					expect(output.type).to.equal('Feature');
					expect(output.geometry.type).to.equal('Point');
					var lat = output.geometry.coordinates[0];
					var lon = output.geometry.coordinates[1];

					expect(lat).to.equal(values.lon);
					expect(lon).to.equal(values.lat);
					done();
			});
		}

		it('should create a location and give it an id', function(done) {
			create_location(values, done);
		});

		it('should create a commercial location', function(done) {
			values.type = 'commercial';
			values.number_of_employees = 1;
			values.annual_recurring_cost = 500;
			values.install_cost = 500;
			values.business_customer_type = { id: 1 };
			create_location(values, done);
		});

		it('should create a residential location', function(done) {
			values.type = 'residential';
			values.number_of_households = 1;
			values.household_customer_type = { id: 1 };
			create_location(values, done);
		});

		it('should create a combo location', function(done) {
			values.type = 'combo';
			values.number_of_households = 1;
			values.number_of_employees = 1;
			values.annual_recurring_cost = 500;
			values.install_cost = 500;
			values.business_customer_type = { id: 1 };
			values.household_customer_type = { id: 1 };
			create_location(values, done);
		});

	});

	describe('#show_businesses()', function(done) {
		var location_id = 31367;

		it('should return a list of all the businesses at the location', function(done) {
			request
				.get('/locations/businesses/'+location_id)
				.accept('application/json')
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(output.length).to.equal(4);
					var number_of_businesses = output.length;
					var business_to_check = output[Math.floor(Math.random() * number_of_businesses ) + 0];
					expect(business_to_check.id).to.be.a('number');
					expect(business_to_check.industry_id).to.be.a('number');
					expect(business_to_check.name).to.be.a('string');
					expect(business_to_check.number_of_employees).to.be.a('number');
					expect(business_to_check.number_of_employees).to.be.above(0);
					expect(business_to_check.install_cost).to.be.a('number');
					expect(business_to_check.install_cost).to.be.above(0);
					expect(business_to_check.annual_recurring_cost).to.be.a('number');
					expect(business_to_check.annual_recurring_cost).to.be.above(0);
					expect(business_to_check.address).to.be.a('string');
					expect(business_to_check.industry_description).to.be.a('string');
					done();
			});
		});

	});

	describe('#update_households()', function() {

		it('should update the number of households', function(done) {
			var location_id = 31367;
			var values = {
				number_of_households: 100,
			};
			request
				.post('/locations/'+location_id+'/update')
				.accept('application/json')
				.send(values)
				.end(function(err, res) {
					if (err) return done(err);
					var output = res.body;
					expect(!!output).to.be.true;
					done();
			});
		});
	});

	describe('#find_industries()', function() {

		it('should return all the industries', function(done) {
			request
				.get('/industries')
				.accept('application/json')
				.end(function(err, res) {
					if (err) return done(err);
					var industries = res.body;
					expect(industries).to.be.an('array');
					expect(industries).to.have.length.above(0);
					var industry = industries[0];
					expect(industry.id).to.be.a('number');
					expect(industry.description).to.be.a('string');
					done();
			});

		});

	});

	describe('#find_customer_types()', function() {

		it('should return all the customer types', function(done) {
			request
				.get('/customer_types')
				.accept('application/json')
				.end(function(err, res) {
					if (err) return done(err);
					var customer_types = res.body;
					expect(customer_types).to.be.an('array');
					expect(customer_types).to.have.length.above(0);
					var customer_type = customer_types[0];
					expect(customer_type.id).to.be.a('number');
					expect(customer_type.name).to.be.a('string');
					done();
			});

		});

	});

});
