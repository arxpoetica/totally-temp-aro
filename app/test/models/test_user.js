var chai = require('chai');
var expect = require('chai').expect;
var models = require('../../models');
var test_utils = require('./test_utils');
var request = test_utils.agent;

chai.use(require('chai-string'));

describe('User', function() {

  before(function() {
    test_utils.logout_app();
  });

  after(function() {
    test_utils.login_app();
  });

  describe('#register() and #login()', function() {

    var email = 'user_'
      + require('crypto').randomBytes(16).toString('hex')
      + '@Example.com';

    var user = {
      first_name: 'Alberto',
      last_name: 'Gimeno',
      email: email,
      password: 'foobar1234',
    };

    var id;

    it('should register a user', function(done) {
      models.User.latest_code = null;
      models.User.register(user, function(err, usr) {
        expect(err).to.not.be.ok;
        expect(usr).to.be.an('object');
        expect(usr.id).to.be.a('number');
        expect(usr.first_name).to.be.equal(user.first_name);
        expect(usr.last_name).to.be.equal(user.last_name);
        expect(usr.email).to.be.equal(user.email.toLowerCase());
        expect(usr.password).to.not.be.ok;
        expect(models.User.latest_code).to.not.be.ok;
        id = usr.id;
        done();
      });
    });

    it('should fail to log in the user with a wrong password', function(done) {
      request
        .post('/login')
        .type('form')
        .send({ email: user.email, password: user.password+'x' })
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.be.equal(302);
          expect(res.headers.location).to.be.equal('/login');

          request
            .get(res.headers.location)
            .end(function(err, res) {
              if (err) return done(err);
              expect(res.statusCode).to.be.equal(200);
              expect(res.text).to.contain('Invalid password');
              done();
            });
        });
    });

    it('should fail to log in the user with a wrong email', function(done) {
      var email = 'x'+user.email;
      request
        .post('/login')
        .accept('application/json')
        .type('form')
        .send({ email: email, password: user.password })
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.be.equal(302);
          expect(res.headers.location).to.be.equal('/login');

          request
            .get(res.headers.location)
            .end(function(err, res) {
              if (err) return done(err);
              expect(res.statusCode).to.be.equal(200);
              expect(res.text).to.contain('No user found with that email ('+email+')');
              done();
            });
        });
    });

    it('should log in the user', function(done) {
      models.User.login(user.email, user.password, function(err, usr) {
        expect(err).to.not.be.ok;
        expect(usr).to.be.an('object');
        expect(usr.id).to.be.a('number');
        expect(usr.first_name).to.be.equal(user.first_name);
        expect(usr.last_name).to.be.equal(user.last_name);
        expect(usr.email).to.be.equal(user.email.toLowerCase());
        expect(usr.password).to.not.be.ok;
        done();
      });
    });

    it('should log in the user through http', function(done) {
      request
        .post('/login')
        .accept('application/json')
        .type('form')
        .send({ email: user.email, password: user.password })
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.be.equal(302);
          expect(res.headers.location).to.be.equal('/');
          done();
        });
    });

    it('should log in the user with email in different case', function(done) {
      models.User.login(user.email.toUpperCase(), user.password, function(err, usr) {
        expect(err).to.not.be.ok;
        expect(usr).to.be.an('object');
        expect(usr.id).to.be.a('number');
        expect(usr.first_name).to.be.equal(user.first_name);
        expect(usr.last_name).to.be.equal(user.last_name);
        expect(usr.email).to.be.equal(user.email.toLowerCase());
        expect(usr.password).to.not.be.ok;
        done();
      });
    });

    it('should log in the user through http', function(done) {
      request
        .post('/login')
        .type('form')
        .send({ email: user.email.toUpperCase(), password: user.password })
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.be.equal(302);
          expect(res.headers.location).to.be.equal('/');
          done();
        });
    });

    it('should find users by text', function(done) {
      request
        .get('/user/find')
        .accept('application/json')
        .query({ text: 'Gi' })
        .end(function(err, res) {
          if (err) return done(err);
          var users = res.body;
          expect(res.statusCode).to.be.equal(200);
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

    it('should log out the user', function(done) {
      request
        .get('/logout')
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.be.equal(302);
          expect(res.headers.location).to.be.equal('/login');

          request
            .get('/')
            .end(function(err, res) {
              if (err) return done(err);
              expect(res.statusCode).to.be.equal(302);
              expect(res.headers.location).to.be.equal('/login');
              done();
            });
        });
    });

    it('should prevent to register a user with the same email address', function(done) {
      user.email = user.email.toLowerCase();
      models.User.register(user, function(err, usr) {
        expect(err).to.be.ok;
        expect(err.message).to.contain('already');
        done();
      });
    });

  });

  describe('password resets', function() {

    var email = 'user_'
      + require('crypto').randomBytes(16).toString('hex')
      + '@Example.com';

    var user = {
      first_name: 'Alberto',
      last_name: 'Gimeno',
      email: email,
    };

    var id;

    it('should register a user with no password', function(done) {
      delete user.password;

      models.User.register(user, function(err, usr) {
        expect(err).to.not.be.ok;
        expect(usr).to.be.an('object');
        expect(usr.id).to.be.a('number');
        expect(usr.first_name).to.be.equal(user.first_name);
        expect(usr.last_name).to.be.equal(user.last_name);
        expect(usr.email).to.be.equal(user.email.toLowerCase());
        expect(usr.password).to.not.be.ok;
        expect(models.User.latest_code).to.be.ok;
        id = usr.id;
        done();
      });

    });

    it('should fail to log a user with no password', function(done) {
      request
        .post('/login')
        .type('form')
        .send({ email: user.email, password: 'asdfa' })
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.be.equal(302);
          expect(res.headers.location).to.be.equal('/login');

          request
            .get('/login')
            .end(function(err, res) {
              if (err) return done(err);
              expect(res.statusCode).to.be.equal(200);
              expect(res.text).to.contain('Invalid password');
              done();
            });
        });
    });

    it('should go to the password reset page', function(done) {
      request
        .get('/forgot_password')
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.be.equal(200);
          done();
        });
    });

    it('should fail to request a password reset if the email does not exist', function(done) {
      models.User.latest_code = null;
      request
        .post('/forgot_password')
        .type('form')
        .send({ email: 'x-'+user.email })
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.be.equal(302);
          expect(res.headers.location).to.be.equal('/forgot_password');
          expect(models.User.latest_code).not.to.be.ok;

          request
            .get(res.headers.location)
            .end(function(err, res) {
              if (err) return done(err);
              expect(res.statusCode).to.be.equal(200);
              expect(res.text).to.contain('No user found with email');
              done();
            });
        });
    });

    it('should request a password reset', function(done) {
      models.User.latest_code = null;
      request
        .post('/forgot_password')
        .type('form')
        .send({ email: user.email })
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.be.equal(302);
          expect(res.headers.location).to.be.equal('/login');
          expect(models.User.latest_code).to.be.ok;
          done();
        });
    });

    it('should load the reset the password page', function(done) {
      request
        .get('/reset_password')
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.be.equal(200);
          done();
        });
    });

    it('should fail to reset the password if the passwords do not match', function(done) {
      user.password = 'new_password';
      request
        .post('/reset_password')
        .type('form')
        .send({ code: models.User.latest_code, password: user.password, repassword: 'x-'+user.password })
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.be.equal(302);
          expect(res.headers.location).to.startsWith('/reset_password');

          request
            .get(res.headers.location)
            .end(function(err, res) {
              if (err) return done(err);
              expect(res.statusCode).to.be.equal(200);
              expect(res.text).to.contain('Passwords do not match');
              done();
            });
        });
    });

    it('should fail to reset the password if the code is wrong', function(done) {
      user.password = 'new_password';
      request
        .post('/reset_password')
        .type('form')
        .send({ code: 'x-'+models.User.latest_code, password: user.password, repassword: user.password })
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.be.equal(302);
          expect(res.headers.location).to.startsWith('/reset_password');

          request
            .get(res.headers.location)
            .end(function(err, res) {
              if (err) return done(err);
              expect(res.statusCode).to.be.equal(200);
              expect(res.text).to.contain('Reset code not found or expired');
              done();
            });
        });
    });

    it('should reset the password', function(done) {
      user.password = 'new_password';
      request
        .post('/reset_password')
        .type('form')
        .send({ code: models.User.latest_code, password: user.password, repassword: user.password })
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.be.equal(302);
          expect(res.headers.location).to.be.equal('/login');
          done();
        });
    });

    it('should log in with the new password', function(done) {
      models.User.login(user.email, user.password, function(err, usr) {
        expect(err).to.not.be.ok;
        expect(usr).to.be.an('object');
        expect(usr.id).to.be.a('number');
        expect(usr.first_name).to.be.equal(user.first_name);
        expect(usr.last_name).to.be.equal(user.last_name);
        expect(usr.email).to.be.equal(user.email.toLowerCase());
        expect(usr.password).to.not.be.ok;
        done();
      });
    });

    it('should change the password knowing the previous one', function(done) {
      var old_password = user.password;
      user.password = 'yet_another_password';

      models.User.change_password(id, old_password, user.password, function(err) {
        if (err) return done(err);

        models.User.login(user.email, user.password, function(err, usr) {
          expect(err).to.not.be.ok;
          expect(usr).to.be.an('object');
          expect(usr.id).to.be.a('number');
          expect(usr.first_name).to.be.equal(user.first_name);
          expect(usr.last_name).to.be.equal(user.last_name);
          expect(usr.email).to.be.equal(user.email.toLowerCase());
          expect(usr.password).to.not.be.ok;
          done();
        });
      })
    });

  })

});
