var expect = require('chai').expect;
var models = require('../../models');
var _ = require('underscore');
var request = require('./test_utils').request;

describe('NetworkPlan', function() {

	var source = '3';
	var target = '40103873';
	var cost_multiplier = 1.5;
	var plan_id;

	it('should create a new empty route', function(done) {
		var area = {
			name: 'Boston, MA, USA',
			centroid: {
				lat: 42.3600825,
				lng: -71.0588801,
			},
			bounds: {
				northeast: {
					lat: 42.3988669,
					lng: -70.9232011,
				},
				southwest: {
					lat: 42.22788,
					lng: -71.191113,
				}
			},
		};
		request
			.post('/network_plan/create')
			.accept('application/json')
			.send({ name: 'Untitled plan', area: area })
			.end(function(err, res) {
				if (err) return done(err);
				var plan = res.body;
				expect(res.statusCode).to.be.equal(200);
				expect(plan).to.have.property('id');
				expect(plan).to.have.property('name');
				plan_id = plan.id;
				done();
		});
	});

	it('should find all plans', function(done) {
		request
			.get('/network_plan/find_all')
			.accept('application/json')
			.end(function(err, res) {
				if (err) return done(err);
				var plans = res.body;
				expect(res.statusCode).to.be.equal(200);
				expect(plans.length > 0).to.equal(true);
				var plan = plans[0];
				expect(plan).to.have.property('id');
				expect(plan).to.have.property('name');
				done();
		});
	});

	it('should return area data from a plan', function(done) {
		request
			.get('/network_plan/'+plan_id+'/area_data')
			.accept('application/json')
			.end(function(err, res) {
				if (err) return done(err);
				var data = res.body;
				expect(res.statusCode).to.be.equal(200);
				expect(data.statefp).to.be.a('string');
				expect(data.countyfp).to.be.a('string');
				done();
		});
	});

	it('should edit basic properties of an existing plans', function(done) {
		var data = {
			name: 'Other name',
		};
		request
			.post('/network_plan/'+plan_id+'/save')
			.accept('application/json')
			.send(data)
			.end(function(err, res) {
				if (err) return done(err);
				var data = res.body;
				expect(res.statusCode).to.be.equal(200);
				done();
		});
	});

	it('should edit the sources and targets of an existing plan', function(done) {
		var changes = {
			insertions: {
				locations: [target],
				network_nodes: [source],
			},
		};
		request
			.post('/network_plan/'+plan_id+'/edit')
			.accept('application/json')
			.send(changes)
			.end(function(err, res) {
				if (err) return done(err);
				var plan = res.body;
				expect(res.statusCode).to.be.equal(200);
				expect(plan).to.have.property('metadata');
				expect(plan).to.have.property('feature_collection');
				expect(plan.feature_collection).to.have.property('type', 'FeatureCollection');
				// expect(plan.feature_collection.features.length > 0).to.be.equal(true);
				done();
		});
	});

	it('should return the information of an existing plan', function(done) {
		request
			.get('/network_plan/'+plan_id)
			.accept('application/json')
			.end(function(err, res) {
				if (err) return done(err);
				var plan = res.body;
				expect(res.statusCode).to.be.equal(200);
				expect(plan).to.have.property('metadata');
				expect(plan.metadata.total_cost).to.be.a('number');

				expect(plan.metadata.costs).to.be.an('array');
				expect(plan.metadata.costs).to.have.length(3);
				expect(plan.metadata.costs[0].name).to.be.equal('Fiber cost');
				expect(plan.metadata.costs[0].value).to.be.a('number');
				expect(plan.metadata.costs[1].name).to.be.equal('Locations cost');
				expect(plan.metadata.costs[1].value).to.be.a('number');
				expect(plan.metadata.costs[2].name).to.be.equal('Equipment nodes cost');
				expect(plan.metadata.costs[2].value).to.be.a('number');
				expect(plan.metadata.total_cost).to.be.a('number');

				expect(plan.metadata.customers_businesses_total).to.be.a('number');
				expect(plan.metadata.customers_households_total).to.be.a('number');
				expect(plan.metadata.customer_types).to.be.an('array');
				// expect(plan.metadata.customer_types[0]).to.be.an('object');
				// expect(plan.metadata.customer_types[0].name).to.be.a('string');
				// expect(plan.metadata.customer_types[0].businesses).to.be.a('number');
				// expect(plan.metadata.customer_types[0].households).to.be.a('number');

				var year = new Date().getFullYear();
				expect(plan.metadata.npv).to.be.an('array');
				expect(plan.metadata.npv).to.have.length(5);
				expect(plan.metadata.npv[0].year).to.be.a('number');
				expect(plan.metadata.npv[0].year).to.be.equal(year);
				expect(plan.metadata.npv[0].value).to.be.a('number');
				expect(plan.metadata.revenue).to.be.a('number');

				expect(plan).to.have.property('feature_collection');
				expect(plan.feature_collection).to.have.property('type', 'FeatureCollection');
				// expect(plan.feature_collection.features.length > 0).to.be.equal(true);

				done();
		});
	});

	it('should return the metadata information of an existing plan', function(done) {
		request
			.get('/network_plan/'+plan_id+'/metadata')
			.accept('application/json')
			.end(function(err, res) {
				if (err) return done(err);
				var plan = res.body;
				expect(res.statusCode).to.be.equal(200);
				expect(plan).to.have.property('metadata');
				expect(plan.metadata.total_cost).to.be.a('number');

				expect(plan.metadata.costs).to.be.an('array');
				expect(plan.metadata.costs).to.have.length(3);
				expect(plan.metadata.costs[0].name).to.be.equal('Fiber cost');
				expect(plan.metadata.costs[0].value).to.be.a('number');
				expect(plan.metadata.costs[1].name).to.be.equal('Locations cost');
				expect(plan.metadata.costs[1].value).to.be.a('number');
				expect(plan.metadata.costs[2].name).to.be.equal('Equipment nodes cost');
				expect(plan.metadata.costs[2].value).to.be.a('number');
				expect(plan.metadata.total_cost).to.be.a('number');

				expect(plan.metadata.customers_businesses_total).to.be.a('number');
				expect(plan.metadata.customers_households_total).to.be.a('number');
				expect(plan.metadata.customer_types).to.be.an('array');
				// expect(plan.metadata.customer_types[0]).to.be.an('object');
				// expect(plan.metadata.customer_types[0].name).to.be.a('string');
				// expect(plan.metadata.customer_types[0].businesses).to.be.a('number');
				// expect(plan.metadata.customer_types[0].households).to.be.a('number');

				var year = new Date().getFullYear();
				expect(plan.metadata.npv).to.be.an('array');
				expect(plan.metadata.npv).to.have.length(5);
				expect(plan.metadata.npv[0].year).to.be.a('number');
				expect(plan.metadata.npv[0].year).to.be.equal(year);
				expect(plan.metadata.npv[0].value).to.be.a('number');
				expect(plan.metadata.revenue).to.be.a('number');

				expect(plan).to.not.have.property('feature_collection');

				done();
		});
	});

	it('should export a route to KML form', function(done) {
		request
			.get('/network_plan/'+plan_id+'/filename/export')
			.end(function(err, res) {
				if (err) return done(err);
				var kml_output = res.text;
				expect(res.statusCode).to.be.equal(200);

				require('xml2js').parseString(kml_output, function(err, result) {
					expect(err).to.not.be.ok;
					expect(result).to.have.property('kml');
					expect(result.kml).to.have.property('$');
					expect(result.kml.$).to.have.property('xmlns');
					expect(result.kml.$.xmlns).to.be.equal('http://www.opengis.net/kml/2.2');
					expect(result.kml).to.have.property('Document');
					expect(result.kml.Document).to.be.an('array');
					expect(result.kml.Document[0]).to.have.property('name');
					expect(result.kml.Document[0]).to.have.property('Style');
					expect(result.kml.Document[0]).to.have.property('Placemark');
					var placemark = result.kml.Document[0].Placemark;
					expect(placemark).to.be.an('array');
					expect(placemark[0]).to.have.property('styleUrl');
					// expect(placemark[0]).to.have.property('LineString');
					// expect(placemark[0].LineString).to.be.an('array');
					// expect(placemark[0].LineString[0]).to.have.property('coordinates');
					// expect(placemark[0].LineString[0].coordinates).to.be.an('array');
					done();
				});
		});
	});

	it('should delete the sources and targets of an existing route', function(done) {
		var changes = {
			deletions: {
				locations: [target],
				network_nodes: [source],
			},
		};
		request
			.post('/network_plan/'+plan_id+'/edit')
			.accept('application/json')
			.send(changes)
			.end(function(err, res) {
				if (err) return done(err);
				var plan = res.body;
				expect(res.statusCode).to.be.equal(200);
				expect(plan).to.have.property('metadata');
				expect(plan).to.have.property('feature_collection');
				expect(plan.feature_collection).to.have.property('type', 'FeatureCollection');
				expect(plan.feature_collection.features.length).to.be.equal(0);
				done();
		});
	});

	it('should delete all the information of an existing route', function(done) {
		request
			.post('/network_plan/'+plan_id+'/clear')
			.accept('application/json')
			.end(function(err, res) {
				if (err) return done(err);
				expect(res.statusCode).to.be.equal(200);
				done();
			});
	});

	it('should delete an existing plan', function(done) {
		request
			.post('/network_plan/'+plan_id+'/delete')
			.accept('application/json')
			.end(function(err, res) {
				if (err) return done(err);
				expect(res.statusCode).to.be.equal(200);
				done();
			});
	});

	it('should check NPV calculation', function() {
		var year = new Date().getFullYear() - 5;
		var revenues = [10.0, 12.0, 14.0, 16.0, 18.0].map(function(value) {
			return { value: value, year: year++ };
		});
		var up_front_costs = 50;
		var output = models.RouteOptimizer.calculate_npv(revenues, up_front_costs);
		output = output.map(function(obj) {
			return obj.value;
		});
		var expected = [-50.0, 7.155963302752293, 7.659287938725695, 8.030708192635068, 8.288574969462799];
		expect(_.isEqual(output, expected)).to.be.true;
	});

});
