var expect = require('chai').expect;
var models = require('../../models');
var MarketSize = models.MarketSize;
var _ = require('underscore');
var request = require('./test_utils').request;

describe('MarketSize', function() {
  var filters;
  var plan_id;

  describe('#filters()', function() {
    it('should return all available filters', function(done) {
      request
        .get('/market_size/filters')
        .accept('application/json')
        .end(function(err, res) {
          if (err) return done(err);
          var output = res.body;
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
        plan_id = route.id;
        
        var source = '3';
        var target = '40103873';
        var changes = {
          insertions: {
            locations: [target],
            network_nodes: [source],
          },
        };
        models.NetworkPlan.edit_route(plan_id, changes, function(err, route) {
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

    it('should return the market size calculation for a route', function(done) {
      var query = {
        type: 'route',
      };
      request
        .get('/market_size/plan/'+plan_id+'/calculate')
        .accept('application/json')
        .query(query)
        .end(function(err, res) {
          if (err) return done(err);
          var output = res.body;
          expect(output).to.be.an('array');
          expect(output).length.to.be.above(0);
          expect(output[0].year).to.be.an('number');
          expect(output[0].total).to.be.a('number');

          var current = _.findWhere(output, { year: new Date().getFullYear() });
          total_current_year_no_filters = current.total;

          done();
      });
    });

    var total_current_year_no_filters;
    var total_current_year_with_filters;

    function round_to_n_decimals(num, decimals) {
      decimals = decimals || 6; // round to 6 decimals by default
      var x = Math.pow(10, decimals);
      return Math.round(num * x) / x;
    }

    it('should return the market size calculation for a given area', function(done) {
      var query = {
        type: 'boundary',
        boundary: boundary,
      };
      request
        .get('/market_size/plan/'+plan_id+'/calculate')
        .accept('application/json')
        .query(query)
        .end(function(err, res) {
          if (err) return done(err);
          var output = res.body;
          expect(output).to.be.an('array');
          expect(output).length.to.be.above(0);
          expect(output[0].year).to.be.an('number');
          expect(output[0].total).to.be.a('number');

          var current = _.findWhere(output, { year: new Date().getFullYear() });
          total_current_year_no_filters = round_to_n_decimals(current.total);

          done();
      });
    });

    it('should return the market size calculation for a given area with filters', function(done) {
      var query = {
        type: 'boundary',
        industry: filters.industries[0].id,
        product: filters.products[0].id,
        employees_range: filters.employees_by_location[0].id,
        boundary: boundary,
      };
      request
        .get('/market_size/plan/'+plan_id+'/calculate')
        .accept('application/json')
        .query(query)
        .end(function(err, res) {
          if (err) return done(err);
          var output = res.body;
          expect(output).to.be.an('array');
          expect(output).length.to.be.above(0);
          expect(output[0].year).to.be.an('number');
          expect(output[0].total).to.be.a('number');

          var current = _.findWhere(output, { year: new Date().getFullYear() });
          total_current_year_with_filters = round_to_n_decimals(current.total);

          done();
      });
    });

    it('should test the export route', function(done) {
      var query = {
        type: 'boundary',
        boundary: boundary,
      };
      request
        .get('/market_size/'+plan_id+'/export')
        .query(query)
        .end(function(err, res) {
          if (err) return done(err);
          var output = res.text;
          expect(output).to.be.a('string');
          expect(output).to.have.length.above(0);
          done();
        });
    });

    it('should export the businesses in a CSV format for a given area', function(done) {
      var options = {
        filters: {},
        boundary: boundary,
      };
      MarketSize.export_businesses(plan_id, 'boundary', options, null, function(err, output, total) {
        expect(err).to.not.be.ok;
        expect(output).to.be.a('string');
        total = round_to_n_decimals(total);
        expect(total).to.be.equal(total_current_year_no_filters);

        done();
      });
    });

    it('should export the businesses in a CSV format for a given area with filters', function(done) {
      var options = {
        filters: {
          industry: [filters.industries[0].id],
          product: [filters.products[0].id],
          employees_range: [filters.employees_by_location[0].id],
        },
        boundary: boundary,
      };
      MarketSize.export_businesses(plan_id, 'boundary', options, null, function(err, output, total) {
        expect(err).to.not.be.ok;
        expect(output).to.be.a('string');
        total = round_to_n_decimals(total);
        expect(total).to.be.equal(total_current_year_with_filters);

        done();
      });
    });

  });

});