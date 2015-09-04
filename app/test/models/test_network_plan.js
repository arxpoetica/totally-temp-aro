var expect = require('chai').expect;
var NetworkPlan = require('../../models/network_plan.js');

describe('NetworkPlan', function() {

	describe('#shortest_path()', function() {
		var source = '1';
		var target = '40103873';
		var cost_multiplier = 1.5;
		var route_id;

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
			NetworkPlan.create_route('Untitled route', area, function(err, route) {
				expect(err).to.not.be.ok;
				expect(route).to.have.property('id');
				expect(route).to.have.property('name');
				route_id = route.id;
				done();
			});
		});

		it('should find all routes', function(done) {
			NetworkPlan.find_all(function(err, routes) {
				expect(routes.length > 0).to.equal(true);
				var route = routes[0];
				expect(route).to.have.property('id');
				expect(route).to.have.property('name');
				done();
			});
		});

		it('should edit basic properties of an existing routes', function(done) {
			var data = {
				name: 'Other name',
			};
			NetworkPlan.save_route(route_id, data, function(err, output) {
				expect(!!output).to.be.equal(true);
				done();
			});
		});

		it('should edit the sources and targets of an existing route', function(done) {
			var changes = {
				insertions: {
					locations: [target],
					network_nodes: [source],
				},
			};
			NetworkPlan.edit_route(route_id, changes, function(err, route) {
				expect(route).to.have.property('metadata');
				expect(route).to.have.property('feature_collection');
				expect(route.feature_collection).to.have.property('type', 'FeatureCollection');
				expect(route.feature_collection.features.length > 0).to.be.equal(true);
				done();
			});
		});

		it('should return the information of an existing route', function(done) {
			NetworkPlan.find_route(route_id, function(err, route) {
				expect(route).to.have.property('metadata');
				expect(route.metadata.total_cost).to.be.a('number');

				expect(route.metadata.costs).to.be.an('array');
				expect(route.metadata.costs).to.have.length(3);
				expect(route.metadata.costs[0].name).to.be.equal('Fiber cost');
				expect(route.metadata.costs[0].value).to.be.a('number');
				expect(route.metadata.costs[1].name).to.be.equal('Locations cost');
				expect(route.metadata.costs[1].value).to.be.a('number');
				expect(route.metadata.costs[2].name).to.be.equal('Equipment nodes cost');
				expect(route.metadata.costs[2].value).to.be.a('number');
				expect(route.metadata.total_cost).to.be.a('number');

				expect(route.metadata.customers_businesses_total).to.be.a('number');
				expect(route.metadata.customers_households_total).to.be.a('number');
				expect(route.metadata.customer_types).to.be.an('array');
				expect(route.metadata.customer_types[0]).to.be.an('object');
				expect(route.metadata.customer_types[0].name).to.be.a('string');
				expect(route.metadata.customer_types[0].businesses).to.be.a('number');
				expect(route.metadata.customer_types[0].households).to.be.a('number');
				
				var year = new Date().getFullYear();
				expect(route.metadata.npv).to.be.an('array');
				expect(route.metadata.npv).to.have.length(5);
				expect(route.metadata.npv[0].year).to.be.a('number');
				expect(route.metadata.npv[0].year).to.be.equal(year);
				expect(route.metadata.npv[0].value).to.be.a('number');
				expect(route.metadata.revenue).to.be.a('number');

				expect(route).to.have.property('feature_collection');
				expect(route.feature_collection).to.have.property('type', 'FeatureCollection');
				expect(route.feature_collection.features.length > 0).to.be.equal(true);
				done();
			});
		});

		it('should export a route to KML form', function(done) {
			NetworkPlan.export_kml(route_id, function(err, kml_output) {
				expect(err).to.not.be.ok;
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
					expect(placemark[0]).to.have.property('LineString');
					expect(placemark[0].LineString).to.be.an('array');
					expect(placemark[0].LineString[0]).to.have.property('coordinates');
					expect(placemark[0].LineString[0].coordinates).to.be.an('array');
					done();
				})
			});
		});

		it('should delete the sources and targets of an existing route', function(done) {
			var changes = {
				deletions: {
					locations: [target],
					network_nodes: [source],
				},
			};
			NetworkPlan.edit_route(route_id, changes, function(err, route) {
				expect(route).to.have.property('metadata');
				expect(route).to.have.property('feature_collection');
				expect(route.feature_collection).to.have.property('type', 'FeatureCollection');
				expect(route.feature_collection.features.length).to.be.equal(0);
				done();
			});
		});

		it('should delete all the information of an existing route', function(done) {
			NetworkPlan.clear_route(route_id, function(err) {
				expect(err).to.be.null;
				done();
			});
		});

		it('should delete an existing route', function(done) {
			NetworkPlan.delete_route(route_id, function(err, output) {
				expect(!!output).to.be.equal(true);
				done();
			});
		});

	});

});