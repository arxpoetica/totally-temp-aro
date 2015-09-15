var expect = require('chai').expect;
var models = require('../../models')

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

    it('should register a user', function(done) {
      models.User.register(user, function(err, usr) {
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

    it('should fail to log in the user with a wrong password', function(done) {
      models.User.login(user.email, user.password+'x', function(err, usr) {
        expect(err).to.be.ok;
        expect(err.message).to.equal('Invalid password');
        done();
      });
    });

    it('should fail to log in the user with a wrong email', function(done) {
      var email = 'x'+user.email;
      models.User.login(email, user.password, function(err, usr) {
        expect(err).to.be.ok;
        expect(err.message).to.equal('No user found with that email ('+email+')');
        done();
      });
    });

    it('should log in the user', function(done) {
      models.User.login(user.email, user.password, function(err, usr) {
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
      models.User.find_by_id(id, function(err, usr) {
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

    it('should users by text', function(done) {
      models.User.find_by_text('Gi', function(err, users) {
        expect(err).to.not.be.ok;
        expect(users).to.be.an('array');
        expect(users).to.have.length.above(0);
        var usr = users[0];
        expect(usr).to.be.an('object');
        expect(usr.id).to.be.a('number');
        expect(usr.first_name).to.be.a('string');
        expect(usr.last_name).to.be.a('string');
        expect(usr.email).to.be.a('string');
        expect(usr.password).to.not.be.ok;
        done();
      });
    });

  });

});
