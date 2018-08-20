#!/usr/bin/env node

var argv = require('yargs')
  .usage('Usage: $0 [options]')
  .describe('f', 'First name')
  .describe('l', 'Last name')
  .describe('e', 'Email')
  .describe('p', 'Password')
  .describe('r', 'Rol')
  .describe('c', 'Company name')
  .alias('f', 'firstName')
  .alias('l', 'lastName')
  .alias('e', 'email')
  .alias('p', 'password')
  .alias('r', 'rol')
  .alias('c', 'companyName')
  .demand(['f', 'l', 'e'])
  .argv

var models = require('../models')

models.User.registerWithPassword(argv, argv.password)
  .then((userId) => {
    console.log('User registered successfully with id =', userId)
    // Add the user to the SuperUsers groups
    return models.User.addUserToGroup(argv.email, 'SuperUsers')
  })
  .then(() => models.User.addUserToGroup(argv.email, 'Administrators')) // Add the users to the Administrators group
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.log('Error', err.message)
    process.exit(1)
  })
