#!/usr/bin/env node

var argv = require('yargs')
  .usage('Usage: $0 [options]')
  .describe('f', 'First name')
  .describe('l', 'Last name')
  .describe('e', 'Email')
  .describe('p', 'Password')
  .alias('f', 'first_name')
  .alias('l', 'last_name')
  .alias('e', 'email')
  .alias('p', 'password')
  .demand(['f', 'l', 'e', 'p'])
  .argv;

var models = require('../models');

models.User.register(argv, function(err, user) {
  if (err) {
    console.log('Error', err.message);
    process.exit(1);
  } else {
    console.log('User registered successfully with id =', user.id);
    process.exit(0);
  }
});
