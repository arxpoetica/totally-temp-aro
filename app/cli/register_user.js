#!/usr/bin/env node

require('babel-register')

var argv = require('yargs')
  .usage('Usage: $0 [options]')
  .describe('f', 'First name')
  .describe('l', 'Last name')
  .describe('e', 'Email')
  .describe('p', 'Password')
  .describe('r', 'Rol')
  .describe('c', 'Company name')
  .alias('f', 'first_name')
  .alias('l', 'last_name')
  .alias('e', 'email')
  .alias('p', 'password')
  .alias('r', 'rol')
  .alias('c', 'company_name')
  .demand(['f', 'l', 'e'])
  .argv

var models = require('../models')

models.User.register(argv)
  .then((user) => {
    console.log('User registered successfully with id =', user.id)
    process.exit(0)
  })
  .catch((err) => {
    console.log('Error', err.message)
    process.exit(1)
  })
