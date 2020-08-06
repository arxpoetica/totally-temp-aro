/* global describe it before after */
var expect = require('chai').expect
var models = require('../../models')
var request = require('./test_utils').request
var test_utils = require('./test_utils')

describe('Permission', () => {
  var plan_id
  var owner
  var guest

  before(() => {
    return Promise.resolve()
      .then(() => {
        // create owner user
        var email = 'user_' +
          require('crypto').randomBytes(16).toString('hex') +
          '@example.com'

        var user = {
          first_name: 'Mr',
          last_name: 'Rabbit',
          email: email,
          password: 'foobar1234'
        }
        return models.User.register(user)
      })
      .then((user) => {
        owner = user

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
        return models.NetworkPlan.createPlan('Untitled plan', area, owner)
      })
      .then((plan) => {
        plan_id = plan.id

        // create guest user
        var email = 'user_' +
          require('crypto').randomBytes(16).toString('hex') +
          '@example.com'

        var user = {
          first_name: 'Jessica',
          last_name: 'Hyide',
          email: email,
          password: 'foobar1234'
        }
        return models.User.register(user)
      })
      .then((user) => {
        guest = user
      })
  })

  after(() => test_utils.loginApp())

  it('should return an empty list for guest\'s plans', () => {
    return models.NetworkPlan.findAll(guest, {})
      .then((plans) => {
        expect(plans).to.be.an('object')
        expect(plans.plans).to.be.an('array')
        expect(plans.plans).to.have.length(0)
      })
  })

  it('should not have permission yet', (done) => {
    test_utils.loginApp(guest)
    request
      .get('/network_plan/' + plan_id + '/area_data')
      .accept('application/json')
      .end((err, res) => {
        if (err) return done(err)
        var data = res.body
        expect(res.statusCode).to.be.equal(403)
        expect(data.error).to.be.equal('Forbidden')
        done()
      })
  })

  it('should return one element for guest\'s plans', () => {
    return models.NetworkPlan.findAll(guest, {})
      .then((plans) => {
        expect(plans).to.be.an('object')
        expect(plans.plans).to.be.an('array')
        expect(plans.plans).to.have.length(1)
        var plan = plans.plans[0]
        expect(plan.owner_id).to.be.equal(owner.id)
        expect(plan.owner_first_name).to.be.equal(owner.first_name)
        expect(plan.owner_last_name).to.be.equal(owner.last_name)
      })
  })

  it('should return an empty list for guest\'s plans', () => {
    return models.NetworkPlan.findAll(guest, {})
      .then((plans) => {
        expect(plans).to.be.an('object')
        expect(plans.plans).to.be.an('array')
        expect(plans.plans).to.have.length(0)
      })
  })
})
