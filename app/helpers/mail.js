var nodemailer = require('nodemailer')
var ses = require('nodemailer-ses-transport')
var AWS = require('aws-sdk')
var config = require('./config')
const URL = require('url').URL
const APP_BASE_HOST = (new URL(config.base_url)).hostname

var region = process.env.AWS_REGION
if (!region) {
  region = 'us-east-1'
  console.warn('NO AWS_REGION found. Using', region)
}
AWS.config.update({ region: region })

var transporter = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
  ? nodemailer.createTransport(ses({ ses: new AWS.SES() }))
  : nodemailer.createTransport() // direct

exports.sendMail = (options) => {
  options.from = `ARO <admin@${APP_BASE_HOST}>`
  return new Promise((resolve, reject) => {
    transporter.sendMail(options, (err, info) => {
      if (err) {
        reject(err)
        return console.log(err)
      }
      console.log('Message sent:', info)
      resolve()
    })
  })
}

/*
// setup e-mail data with unicode symbols
var mailOptions = {
  from: 'Fred Foo ✔ <foo@blurdybloop.com>', // sender address
  to: 'bar@blurdybloop.com, baz@blurdybloop.com', // list of receivers
  subject: 'Hello ✔', // Subject line
  text: 'Hello world ✔', // plaintext body
  html: '<b>Hello world ✔</b>' // html body
};
*/
