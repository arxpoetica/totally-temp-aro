var expect = require('chai').expect;
var txain = require('txain');
var models = require('../../models');

describe('Permission', function() {

  var plan_id;
  var owner;
  var guest;

  before(function(done) {
    txain(function(callback) {
      // create owner user
      var email = 'user_'
        + require('crypto').randomBytes(16).toString('hex')
        + '@example.com';

      var user = {
        first_name: 'Mr',
        last_name: 'Rabbit',
        email: email,
        password: 'foobar1234',
      };
      models.User.register(user, callback);
    })
    .then(function(user, callback) {
      owner = user;

      var area = {
        "name": "Manhattan, New York, NY, USA",
        "centroid": {
          "lat": 40.7830603,
          "lng": -73.9712488
        },
        "bounds": {
          "northeast": {
            "lat": 40.882214,
            "lng": -73.907
          },
          "southwest": {
            "lat": 40.6803955,
            "lng": -74.047285
          }
        }
      };
      models.NetworkPlan.create_plan('Untitled plan', area, owner, callback);
    })
    .then(function(plan, callback) {
      plan_id = plan.id;

      // create guest user
      var email = 'user_'
        + require('crypto').randomBytes(16).toString('hex')
        + '@example.com';

      var user = {
        first_name: 'Jessica',
        last_name: 'Hyide',
        email: email,
        password: 'foobar1234',
      };
      models.User.register(user, callback);
    })
    .then(function(user, callback) {
      guest = user;
      callback();
    })
    .end(function(err) {
      expect(err).to.not.be.ok;
      done()
    });
  });

  it('should check the owner\'s permission', function(done) {
    models.Permission.find_permission(plan_id, owner.id, function(err, permission) {
      expect(err).to.not.be.ok;
      expect(permission).to.be.an('object');
      expect(permission.rol).to.be.equal('owner');
      done();
    });
  });

  it('should return an empty list for guest\'s plans', function(done) {
    models.NetworkPlan.find_all(guest, function(err, plans) {
      expect(err).to.not.be.ok;
      expect(plans).to.be.an('array');
      expect(plans).to.have.length(0);
      done();
    });
  });

  it('should grant access to the guest user', function(done) {
    models.Permission.grant_access(plan_id, guest.id, 'guest', function(err) {
      expect(err).to.not.be.ok;
      done();
    });
  });

  it('should return one element for guest\'s plans', function(done) {
    models.NetworkPlan.find_all(guest, function(err, plans) {
      expect(err).to.not.be.ok;
      expect(plans).to.be.an('array');
      expect(plans).to.have.length(1);
      var plan = plans[0];
      expect(plan.owner_id).to.be.equal(owner.id);
      expect(plan.owner_first_name).to.be.equal(owner.first_name);
      expect(plan.owner_last_name).to.be.equal(owner.last_name);
      done();
    });
  });

  it('should revoke access to the guest user', function(done) {
    models.Permission.revoke_access(plan_id, guest.id, function(err) {
      expect(err).to.not.be.ok;
      done();
    });
  });

  it('should return an empty list for guest\'s plans', function(done) {
    models.NetworkPlan.find_all(guest, function(err, plans) {
      expect(err).to.not.be.ok;
      expect(plans).to.be.an('array');
      expect(plans).to.have.length(0);
      done();
    });
  });


});

        
        