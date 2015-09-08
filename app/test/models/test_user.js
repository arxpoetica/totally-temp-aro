var expect = require('chai').expect;
var User = require('../../models/user.js');

describe('User', function() {

  var email = 'user_'
    + require('crypto').randomBytes(16).toString('hex')
    + '@example.com';

  var user = {
    first_name: 'Alberto',
    last_name: 'Gimeno',
    email: email,
    password: 'foobar1234',
  };

  var id;

  describe('#register() and #login()', function() {
    var carrier_name = 'VERIZON';

    it('should register a user', function(done) {
      User.register(user, function(err, usr) {
        expect(err).to.not.be.ok;
        expect(usr).to.be.an('object');
        expect(usr.id).to.be.a('number');
        expect(usr.first_name).to.be.equal(user.first_name);
        expect(usr.last_name).to.be.equal(user.last_name);
        expect(usr.email).to.be.equal(user.email);
        expect(usr.password).to.not.be.ok;
        id = usr.id;
        done();
      });
    });

    it('should log in the user', function(done) {
      User.login(user.email, user.password, function(err, usr) {
        expect(err).to.not.be.ok;
        expect(usr).to.be.an('object');
        expect(usr.id).to.be.a('number');
        expect(usr.first_name).to.be.equal(user.first_name);
        expect(usr.last_name).to.be.equal(user.last_name);
        expect(usr.email).to.be.equal(user.email);
        expect(usr.password).to.not.be.ok;
        done();
      });
    });

    it('should find the user by id', function(done) {
      User.find_by_id(id, function(err, usr) {
        expect(err).to.not.be.ok;
        expect(usr).to.be.an('object');
        expect(usr.id).to.be.a('number');
        expect(usr.first_name).to.be.equal(user.first_name);
        expect(usr.last_name).to.be.equal(user.last_name);
        expect(usr.email).to.be.equal(user.email);
        expect(usr.password).to.not.be.ok;
        done();
      });
    });

  });

});
