/* global describe it before */
var expect = require('chai').expect
var models = require('../../models')
var test_utils = require('./test_utils')
var request = test_utils.request

describe('Network', () => {
  describe('#viewFiberPlantForCarrier()', () => {
    var carrier_name = 'VERIZON'

    it('should return a feature collection', (done) => {
      request
        .get('/network/fiber_plant/' + carrier_name)
        .query(test_utils.testViewport())
        .accept('application/json')
        .end((err, res) => {
          if (err) return done(err)
          var output = res.body
          expect(res.statusCode).to.be.equal(200)
          expect(output.feature_collection).to.have.property('type', 'FeatureCollection')
          expect(output.feature_collection.features).to.have.length.above(0)

          var first_feature = output.feature_collection.features[0]
          expect(first_feature.geometry.type).to.equal('LineString')
          expect(first_feature.geometry.coordinates).to.have.length.above(0)
          done()
        })
    })
  })

  describe('#viewNetworkNodes()', () => {
    var node_type = 'central_office'

    it('should return a feature collection', (done) => {
      request
        .get('/network/nodes/' + node_type)
        .query(test_utils.testViewport())
        .accept('application/json')
        .end((err, res) => {
          if (err) return done(err)
          var output = res.body
          expect(output.feature_collection).to.have.property('type', 'FeatureCollection')
          expect(output.feature_collection.features).to.have.length.above(0)

          var first_feature = output.feature_collection.features[0]
          expect(first_feature.geometry.type).to.equal('Point')
          expect(first_feature.geometry.coordinates).to.have.length.above(0)
          expect(first_feature.properties.id).to.be.a('string')
          done()
        })
    })
  })

  describe('#viewNetworkNodeTypes()', () => {
    it('should return all available network node types', (done) => {
      request
        .get('/network/nodes')
        .accept('application/json')
        .end((err, res) => {
          if (err) return done(err)
          var output = res.body
          expect(output.length).to.be.above(0)
          expect(output[0]).to.have.property('id')
          expect(output[0]).to.have.property('name')
          expect(output[0]).to.have.property('description')
          done()
        })
    })
  })

  describe('#carriers()', () => {
    it('should return all carriers', (done) => {
      request
        .get('/network/carriers/1') // TODO: should test an existing plan
        .accept('application/json')
        .end((err, res) => {
          if (err) return done(err)
          var output = res.body
          expect(res.statusCode).to.be.equal(200)
          expect(output.length).to.be.equal(34)
          expect(output.length).to.be.above(0)
          expect(output[0]).to.be.an('object')
          expect(output[0].id).to.be.a('number')
          expect(output[0].name).to.be.a('string')
          expect(output[0].color).to.be.a('string')
          done()
        })
    })
  })

  describe('#editNetworkNodes() and #clearNetworkNodes()', () => {
    var plan_id
    var nodes
    var node_id

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
      return models.NetworkPlan.createPlan('Untitled plan', area, test_utils.test_user)
        .then((plan) => {
          expect(plan).to.have.property('id')
          expect(plan).to.have.property('name')
          plan_id = plan.id
        })
    })

    it('should count the network nodes not associated to a plan', () => {
      return models.Network.viewNetworkNodes(['central_office'], 0, test_utils.testViewport())
        .then((output) => {
          nodes = output.feature_collection.features.length
        })
    })

    it('should not fail with empty changes', (done) => {
      request
        .post('/network/nodes/' + plan_id + '/edit')
        .accept('application/json')
        .send({})
        .end((err, res) => {
          if (err) return done(err)
          // var output = res.body
          expect(res.statusCode).to.be.equal(200)
          done()
        })
    })

    it('should add new network nodes', (done) => {
      var changes = {
        insertions: [
          {
            lat: 40.7752768348037,
            lon: -73.9540386199951,
            type: 2
          }
        ]
      }
      request
        .post('/network/nodes/' + plan_id + '/edit')
        .accept('application/json')
        .send(changes)
        .end((err, res) => {
          if (err) return done(err)
          // var output = res.body
          expect(res.statusCode).to.be.equal(200)

          models.Network.viewNetworkNodes(['central_office'], plan_id, test_utils.testViewport())
            .then((output) => {
              // TODO: viewport in Boston
              // var diff = output.feature_collection.features.length - nodes
              // expect(diff).to.be.equal(1)
              done()
            })
            .catch(done)
        })
    })

    it('should calculate the cost of new network nodes', () => {
      return models.RouteOptimizer.calculateEquipmentNodesCost(plan_id)
        .then((output) => {
          expect(output.equipment_node_types).to.be.an('array')
          expect(output.total).to.be.a('number')
        })
    })

    it('should return network nodes of a type', (done) => {
      request
        .get('/network/nodes/' + plan_id + '/find')
        .query(test_utils.testViewport())
        .accept('application/json')
        .query({ node_types: 'splice_point' })
        .end((err, res) => {
          if (err) return done(err)
          var output = res.body
          expect(output.feature_collection.features).to.be.an('array')
          expect(output.feature_collection.features).to.have.length(1)
          node_id = output.feature_collection.features[0].properties.id
          done()
        })
    })

    it('should edit network nodes', (done) => {
      var changes = {
        updates: [
          {
            lat: 40.7752768348037,
            lon: -73.9540386199951,
            type: 2,
            id: node_id
          }
        ]
      }
      request
        .post('/network/nodes/' + plan_id + '/edit')
        .accept('application/json')
        .send(changes)
        .end((err, res) => {
          if (err) return done(err)
          // var output = res.body
          expect(res.statusCode).to.be.equal(200)
          done()
        })
    })

    it('should add another network node', (done) => {
      var changes = {
        insertions: [
          {
            lat: 40.7752768348037,
            lon: -73.9540386199951,
            type: 2
          }
        ]
      }
      request
        .post('/network/nodes/' + plan_id + '/edit')
        .accept('application/json')
        .send(changes)
        .end((err, res) => {
          if (err) return done(err)
          // var output = res.body
          expect(res.statusCode).to.be.equal(200)
          done()
        })
    })

    it('should delete network nodes', (done) => {
      var changes = {
        deletions: [
          {
            id: node_id
          }
        ]
      }
      request
        .post('/network/nodes/' + plan_id + '/edit')
        .accept('application/json')
        .send(changes)
        .end((err, res) => {
          if (err) return done(err)
          // var output = res.body
          expect(res.statusCode).to.be.equal(200)
          done()
        })
    })

    it('should clear the network nodes in a plan', (done) => {
      request
        .post('/network/nodes/' + plan_id + '/clear')
        .accept('application/json')
        .end((err, res) => {
          if (err) return done(err)
          expect(res.statusCode).to.be.equal(200)

          models.Network.viewNetworkNodes(['central_office'], plan_id, test_utils.testViewport())
            .then((output) => {
              // TODO: viewport in Boston
              // var diff = output.feature_collection.features.length - nodes
              // expect(diff).to.be.equal(0)
              done()
            })
            .catch(done)
        })
    })
  })
})
