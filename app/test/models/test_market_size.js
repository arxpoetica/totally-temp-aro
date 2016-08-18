/* global describe it before */
var expect = require('chai').expect
var models = require('../../models')
var _ = require('underscore')
var test_utils = require('./test_utils')
var request = test_utils.request

describe('MarketSize', () => {
  var filters
  var plan_id

  describe('#filters()', () => {
    it('should return all available filters', (done) => {
      request
        .get('/market_size/filters')
        .accept('application/json')
        .end((err, res) => {
          if (err) return done(err)
          var output = res.body
          expect(output).to.have.property('products')
          expect(output.products).to.be.an('array')
          expect(output.products).to.have.length.above(0)
          expect(output.products[0].id).to.be.a('number')
          expect(output.products[0].product_type).to.be.a('string')
          expect(output.products[0].product_name).to.be.a('string')

          expect(output).to.have.property('industries')
          expect(output.industries).to.be.an('array')
          expect(output.industries).to.have.length.above(0)
          expect(output.industries[0].id).to.be.a('number')
          expect(output.industries[0].industry_name).to.be.a('string')

          expect(output).to.have.property('employees_by_location')
          expect(output.employees_by_location).to.be.an('array')
          expect(output.employees_by_location).to.have.length.above(0)
          expect(output.employees_by_location[0].id).to.be.a('number')
          expect(output.employees_by_location[0].value_range).to.be.a('string')
          expect(output.employees_by_location[0].min_value).to.be.a('number')
          expect(output.employees_by_location[0].max_value).to.be.a('number')

          filters = output

          done()
        })
    })
  })

  describe('#calculate()', () => {
    before(() => {
      var area = {
        name: 'Boston, MA, USA',
        centroid: {
          'type': 'Point',
          'coordinates': [-71.0588801, 42.3600825]
        },
        bounds: {
          'type': 'Polygon',
          'coordinates': [
            [
              [-70.9232011, 42.3988669],
              [-70.9232011, 42.2278801],
              [-71.191113, 42.2278801],
              [-71.191113, 42.3988669],
              [-70.9232011, 42.3988669]
            ]
          ]
        }
      }
      return models.NetworkPlan.createPlan('Untitled plan', area)
        .then((plan) => {
          plan_id = plan.id

          var source = '3'
          var target = '40103873'
          var changes = {
            insertions: {
              locations: [target],
              network_nodes: [source]
            }
          }
          return models.NetworkPlan.editRoute(plan_id, changes)
        })
    })

    var boundary = JSON.stringify({
      'type': 'MultiPolygon',
      'coordinates': [
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
    })

    it('should return the market size calculation for a route', (done) => {
      var query = {
        type: 'all'
      }
      request
        .get('/market_size/plan/' + plan_id + '/calculate')
        .accept('application/json')
        .query(test_utils.testViewport(query))
        .end((err, res) => {
          if (err) return done(err)
          var output = res.body
          expect(output).to.be.an('object')
          expect(output.market_size).to.be.an('array')
          expect(output.fair_share).to.be.an('array')
          expect(output.market_size_existing).to.be.an('array')

          var current = _.findWhere(output.market_size, { year: new Date().getFullYear() })
          total_current_year_no_filters = current.total

          done()
        })
    })

    var total_current_year_no_filters
    var total_current_year_with_filters

    function round_to_n_decimals (num, decimals) {
      decimals = decimals || 6 // round to 6 decimals by default
      var x = Math.pow(10, decimals)
      return Math.round(num * x) / x
    }

    it('should return the market size calculation for a given area', (done) => {
      var query = {
        type: 'all',
        boundary: boundary
      }
      request
        .get('/market_size/plan/' + plan_id + '/calculate')
        .accept('application/json')
        .query(test_utils.testViewport(query))
        .end((err, res) => {
          if (err) return done(err)
          var output = res.body
          expect(output).to.be.an('object')
          expect(output.market_size).to.be.an('array')
          expect(output.market_size).length.to.be.above(0)
          expect(output.market_size[0].year).to.be.an('number')
          expect(output.market_size[0].total).to.be.a('number')

          // var current = _.findWhere(output.market_size, { year: new Date().getFullYear() })

          done()
        })
    })

    it('should return the market size calculation for a given area with filters', (done) => {
      var query = {
        type: 'all',
        industry: filters.industries[0].id,
        product: filters.products[0].id,
        employees_range: filters.employees_by_location[0].id,
        boundary: boundary
      }
      request
        .get('/market_size/plan/' + plan_id + '/calculate')
        .accept('application/json')
        .query(test_utils.testViewport(query))
        .end((err, res) => {
          if (err) return done(err)
          var output = res.body
          expect(output).to.be.an('object')
          expect(output.market_size).to.be.an('array')
          expect(output.market_size).length.to.be.above(0)
          expect(output.market_size[0].year).to.be.an('number')
          expect(output.market_size[0].total).to.be.a('number')

          var current = _.findWhere(output.market_size, { year: new Date().getFullYear() })
          total_current_year_with_filters = round_to_n_decimals(current.total)

          done()
        })
    })

    it('should test the export route', (done) => {
      var query = {
        type: 'all',
        boundary: boundary
      }
      request
        .get('/market_size/' + plan_id + '/export')
        .query(test_utils.testViewport(query))
        .end((err, res) => {
          if (err) return done(err)
          var output = res.text
          expect(output).to.be.a('string')
          expect(output).to.have.length.above(0)
          done()
        })
    })

    it('should export the businesses in a CSV format for a given area', () => {
      var options = {
        filters: {},
        boundary: boundary
      }
      return models.MarketSize.exportBusinesses(plan_id, 'all', options, null)
        .then((output) => {
          expect(output).to.be.an('object')
          expect(output.csv).to.be.a('string')
          var total = round_to_n_decimals(output.total)
          // expect(total).to.be.equal(total_current_year_no_filters)
          console.log('total', total, total_current_year_no_filters)
        })
    })

    it('should export the businesses in a CSV format for a given area with filters', () => {
      var options = {
        filters: {
          industry: [filters.industries[0].id],
          product: [filters.products[0].id],
          employees_range: [filters.employees_by_location[0].id]
        },
        boundary: boundary
      }
      return models.MarketSize.exportBusinesses(plan_id, 'all', options, null)
        .then((output) => {
          expect(output).to.be.an('object')
          expect(output.csv).to.be.a('string')
          var total = round_to_n_decimals(output.total)
          expect(total).to.be.equal(total_current_year_with_filters)
        })
    })
  })
})
