/* global describe it */
var expect = require('chai').expect
var database = require('../../helpers/database.js')

describe('Database helper', () => {
  it('should return an error if the connection string is not ok', () => {
    process.env.DATABASE_URL = 'wrong_url'
    return database.query('select foo')
      .then(() => Promise.reject('This should not run'))
      .catch((err) => {
        expect(err).to.be.ok
        delete process.env.DATABASE_URL
      })
  })

  it('should return an error if a query fails', () => {
    return database.query('select foo')
      .then(() => Promise.reject('This should not run'))
      .catch((err) => expect(err).to.be.ok)
  })

  it('should execute a query without params', () => {
    return database.execute('select 1')
      .then((rowCount) => expect(rowCount).to.be.equal(1))
  })

  it('should find one result without params', () => {
    return database.findOne('select 1 as one')
      .then((row) => expect(row.one).to.be.equal(1))
  })

  it('should return a default value if no results are found', () => {
    return database.findOne('select * from (select 1 where 1=2) foo;', [], { value: 2 })
      .then((row) => expect(row.value).to.be.equal(2))
  })
})
