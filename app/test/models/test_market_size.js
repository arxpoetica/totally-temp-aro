var expect = require('chai').expect;
var models = require('../../models');
var MarketSize = models.MarketSize;

describe('MarketSize', function() {
  var filters;
  var route_id;

  describe('#filters()', function() {
    it('should return all available filters', function(done) {
      MarketSize.filters(function(err, output) {
        expect(err).to.not.be.ok;
        expect(output).to.have.property('products');
        expect(output.products).to.be.an('array');
        expect(output.products).to.have.length.above(0);
        expect(output.products[0].id).to.be.a('number');
        expect(output.products[0].product_type).to.be.a('string');
        expect(output.products[0].product_name).to.be.a('string');

        expect(output).to.have.property('industries');
        expect(output.industries).to.be.an('array');
        expect(output.industries).to.have.length.above(0);
        expect(output.industries[0].id).to.be.a('number');
        expect(output.industries[0].industry_name).to.be.a('string');

        expect(output).to.have.property('employees_by_location');
        expect(output.employees_by_location).to.be.an('array');
        expect(output.employees_by_location).to.have.length.above(0);
        expect(output.employees_by_location[0].id).to.be.a('number');
        expect(output.employees_by_location[0].value_range).to.be.a('string');
        expect(output.employees_by_location[0].min_value).to.be.a('number');
        expect(output.employees_by_location[0].max_value).to.be.a('number');

        filters = output;

        done();
      });
    });
  });

  describe('#calculate()', function() {

    before(function(done) {
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
      models.NetworkPlan.create_plan('Untitled plan', area, function(err, route) {
        route_id = route.id;
        
        var source = '3';
        var target = '40103873';
        var changes = {
          insertions: {
            locations: [target],
            network_nodes: [source],
          },
        };
        models.NetworkPlan.edit_route(route_id, changes, function(err, route) {
          expect(err).to.not.be.ok;
          done();
        });

      });
    });

    var boundary = JSON.stringify({
      "type": "MultiPolygon",
      "coordinates": [
        [
          [
            [
              -73.95897408997467,
              40.773107145783655
            ],
            [
              -73.95897408997467,
              40.77244698906216
            ],
            [
              -73.96030312454155,
              40.77244698906216
            ],
            [
              -73.96030312454155,
              40.773107145783655
            ],
            [
              -73.95897408997467,
              40.773107145783655
            ]
          ]
        ]
      ]
    });

    it('should return the market size calculation for a given area', function(done) {
      MarketSize.calculate(route_id, 'route', { filters: {} }, function(err, output) {
        expect(err).to.not.be.ok;
        expect(output).to.be.an('array');
        expect(output).length.to.be.above(0);
        expect(output[0].year).to.be.an('number');
        expect(output[0].total).to.be.a('number');
        done();
      });
    });

    it('should return the market size calculation for a given area with filters', function(done) {
      var options = {
        filters: {
          industry: filters.industries[0].id,
          product: filters.products[0].id,
          employees_range: filters.employees_by_location[0].id,
        },
        boundary: boundary,
      };
      MarketSize.calculate(route_id, 'boundary', options, function(err, output) {
        expect(err).to.not.be.ok;
        expect(output).to.be.an('array');
        expect(output).length.to.be.above(0);
        expect(output[0].year).to.be.an('number');
        expect(output[0].total).to.be.a('number');

        done();
      });
    });
  });

});