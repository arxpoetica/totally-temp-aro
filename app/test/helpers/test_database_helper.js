var expect = require('chai').expect;
var database = require('../../helpers/database.js');

describe('Database helper', function() {

  it('should return an error if the connection string is not ok', function(done) {
    process.env.DATABASE_URL = 'wrong_url'
    database.query('select foo', function(err) {
      expect(!!err).to.be.true;
      delete process.env.DATABASE_URL;
      done();
    });
  });

  it('should return an error if the connection string is not ok', function(done) {
    process.env.DATABASE_URL = 'wrong_url'
    database.execute('select foo', function(err) {
      expect(!!err).to.be.true;
      delete process.env.DATABASE_URL;
      done();
    });
  });

  it('should return an error if a query fails', function(done) {
    database.query('select foo', function(err) {
      expect(!!err).to.be.true;
      done();
    });
  });

  it('should return an error if a sql fails', function(done) {
    database.execute('select foo', function(err) {
      expect(!!err).to.be.true;
      done();
    });
  });

  it('should execute a query without params', function(done) {
    database.execute('select 1', function(err, rowCount) {
      expect(err).to.be.null;
      expect(!!rowCount).to.be.true;
      done();
    });
  });

  it('should find one result without params', function(done) {
    database.findOne('select 1 as one', function(err, row) {
      expect(err).to.be.null;
      expect(row.one).to.be.equal(1);
      done();
    });
  });

  it('should return a default value if no results are found', function(done) {
    database.findOne('select * from (select 1 where 1=2) foo;', [], { value: 2 }, function(err, row) {
      expect(err).to.be.null;
      expect(row.value).to.be.equal(2);
      done();
    });
  });

});