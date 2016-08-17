/* global describe it before */
var expect = require('chai').expect
var models = require('../../models')
var test_utils = require('./test_utils')
var request = test_utils.request

describe('Boundary', () => {
  var plan_id
  var boundary_id
  var geom = '{"type":"MultiPolygon","coordinates":[[[[-73.95953178405762,40.77779987546684],[-73.94948959350586,40.775265016944275],[-73.95790100097656,40.76947997759306],[-73.96373748779297,40.77201505683673]]]]}'

  before(() => {
    var area = {
      'name': 'Manhattan, New York, NY, USA',
      'centroid': {
        'type': 'Point',
        'coordinates': [-73.9712488, 40.7830603]
      },
      'bounds': {
        'type': 'Polygon',
        'coordinates': [
          [
            [-73.70027209999999, 40.9152555],
            [-73.70027209999999, 40.496044],
            [-74.255735, 40.496044],
            [-74.255735, 40.9152555],
            [-73.70027209999999, 40.9152555]
          ]
        ]
      }
    }
    return models.NetworkPlan.createPlan('Untitled route', area, test_utils.test_user)
      .then((plan) => {
        expect(plan).to.have.property('id')
        expect(plan).to.have.property('name')
        plan_id = plan.id
      })
  })

  it('should create a boundary', (done) => {
    var data = {
      name: 'Boundary name',
      geom: geom
    }
    request
      .post('/boundary/' + plan_id + '/create')
      .accept('application/json')
      .send(data)
      .end((err, res) => {
        if (err) return done(err)
        var boundary = res.body
        expect(res.statusCode).to.be.equal(200)

        expect(boundary.id).to.be.a('string')
        expect(boundary.name).to.be.a('string')
        expect(boundary.name).to.be.equal(data.name)
        expect(boundary.geom).to.be.an('object')
        expect(boundary.geom.type).to.be.equal('MultiPolygon')
        expect(boundary.geom.coordinates).to.be.an('array')
        boundary_id = boundary.id
        done()
      })
  })

  it('should edit a boundary', (done) => {
    var data = {
      id: boundary_id,
      plan_id: plan_id,
      name: 'New boundary name',
      geom: geom
    }
    request
      .post('/boundary/' + plan_id + '/edit/' + boundary_id)
      .accept('application/json')
      .send(data)
      .end((err, res) => {
        if (err) return done(err)
        var output = res.body
        expect(res.statusCode).to.be.equal(200)
        expect(output).to.be.equal(1)
        done()
      })
  })

  it('should not edit a boundary with an invalid plan_id', (done) => {
    var data = {
      id: boundary_id,
      plan_id: -1,
      name: 'New boundary name',
      geom: geom
    }
    request
      .post('/boundary/666/edit/' + boundary_id)
      .accept('application/json')
      .send(data)
      .end((err, res) => {
        if (err) return done(err)
        var output = res.body
        expect(res.statusCode).to.be.equal(403)
        expect(output.error).to.be.equal('Forbidden')
        done()
      })
  })

  it('should list the existing boundaries', (done) => {
    request
      .get('/boundary/' + plan_id + '/find')
      .accept('application/json')
      .end((err, res) => {
        if (err) return done(err)
        var list = res.body
        expect(res.statusCode).to.be.equal(200)
        expect(list).to.be.an('array')
        expect(list).to.have.length(1)
        var boundary = list[0]
        expect(boundary.id).to.be.equal(boundary_id)
        expect(boundary.name).to.be.a('string')
        expect(boundary.geom).to.be.an('object')
        expect(boundary.geom.type).to.be.equal('MultiPolygon')
        expect(boundary.geom.coordinates).to.be.an('array')
        done()
      })
  })

  it('should delete a boundary', (done) => {
    request
      .post('/boundary/' + plan_id + '/delete/' + boundary_id)
      .accept('application/json')
      .end((err, res) => {
        if (err) return done(err)
        var output = res.body
        expect(res.statusCode).to.be.equal(200)
        expect(output).to.be.equal(1)

        models.Boundary.findBoundary(plan_id)
          .then((list) => {
            expect(list).to.have.length(0)
            done()
          })
          .catch(done)
      })
  })
})
