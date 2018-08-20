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
var helpers = require('../helpers')
var database = helpers.database

// Code to add user to a group. We cannot use aro-service for ETL
var addUserToGroup = (email, groupName) => {
  const sqlAddUserToGroup = `
    INSERT INTO auth.user_auth_group(user_id, auth_group_id)
    VALUES(
      (SELECT id FROM auth.users WHERE email='${email}'),
      (SELECT id FROM auth.auth_group WHERE name='${groupName}')
    );
  `
  return database.query(sqlAddUserToGroup)
}

// Do not add to Public group via aro-service as we do not have access to it
models.User.registerWithPassword(argv, false, argv.password)
  .then((userId) => {
    console.log('User registered successfully with id =', userId)
    // Add the user to the Public group
    return addUserToGroup(argv.email, 'Public')
  })
  .then(() => addUserToGroup(argv.email, 'Administrators')) // Add the users to the Administrators group
  .then(() => addUserToGroup(argv.email, 'SuperUsers')) // Add the users to the SuperUsers group
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.log('Error', err.message)
    process.exit(1)
  })
