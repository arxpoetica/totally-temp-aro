var expect = require('chai').expect;
var MarketSize = require('../../models/market_size.js');

describe.only('MarketSize', function() {
  var filters;

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
    var geo_json = JSON.stringify({
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
      MarketSize.calculate(geo_json, 0, {}, function(err, output) {
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
        industry: filters.industries[0].id,
        product: filters.products[0].id,
        employees_range: filters.employees_by_location[0].id,
      };
      MarketSize.calculate(geo_json, 152.4, options, function(err, output) {
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