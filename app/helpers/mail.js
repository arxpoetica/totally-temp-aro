var nodemailer = require('nodemailer')
var ses = require('nodemailer-ses-transport')
var AWS = require('aws-sdk')
var config = require('./config')

var region = process.env.AWS_REGION
if (!region) {
  region = 'us-east-1'
  console.warn('NO AWS_REGION found. Using', region)
}
AWS.config.update({ region: region })

var transporter = process.env.NODE_ENV === 'production'
  ? nodemailer.createTransport(ses({ ses: new AWS.SES() }))
  : nodemailer.createTransport() // direct

exports.sendMail = (options) => {
  options.from = `ARO <${config.from_email_address}>`
  return new Promise((resolve, reject) => {
    transporter.sendMail(options, (err, info) => {
      if (err) {
        reject(err)
        return console.log(err)
      }
      console.log('Message sent:', info)
      if (Array.isArray(info.accepted) && info.accepted.length === 0) {
        console.log('Mail not accepted', options)
      }
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
