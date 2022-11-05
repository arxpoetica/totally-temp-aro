#!/usr/bin/env node

import yargs from 'yargs'
import database from '../helpers/database.cjs'
import User from '../models/user.js'

var argv = yargs
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
  .demandOption(['f', 'l', 'e'])
  .argv


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

// Default initialization of aro_core.user_configuration
var initializeUserConfiguration = (userId) => {
  console.log('initializeUserConfiguration successfully with id =', userId)
  const sql = `
    INSERT INTO aro_core.user_configuration(user_id, perspective, project_template_id)
    VALUES (${userId}, 'admin', 1);
  `
  return database.query(sql)
}

// Default initialization of aro_core.library_actor_permission
var initializeUserLibraryPermission = (userId) => {
  console.log('initializeUserLibraryPermission successfully with id =', userId)
  const sql = `
    INSERT INTO aro_core.library_actor_permission(actor_id, library_id, permissions)
    VALUES (${userId}, 1, 4),(${userId}, 2, 4),(${userId}, 3, 4),(${userId}, 4, 4),
    (${userId}, 5, 4),(${userId}, 6, 4),(${userId}, 7, 4),(${userId}, 8, 4),(${userId}, 9, 4);
  `
  return database.query(sql)
}

// Do not add to Public group via aro-service as we do not have access to it
argv.groupIds = []
argv.isGlobalSuperUser = true
var createdUserId = null
User.registerFromETL(argv, argv.password)
  .then((userId) => {
    createdUserId = userId
    console.log('User registered successfully with id =', userId)
    // Add the user to the Public group
    return addUserToGroup(argv.email, 'Public')
  })
  .then(() => addUserToGroup(argv.email, 'Administrators')) // Add the users to the Administrators group
  .then(() => addUserToGroup(argv.email, 'SuperUsers')) // Add the users to the SuperUsers group
  .then(() => initializeUserConfiguration(createdUserId))
  .then(() => initializeUserLibraryPermission(createdUserId))
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.log('Error', err)
    process.exit(1)
  })
