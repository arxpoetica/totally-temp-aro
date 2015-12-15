var nodemailer = require('nodemailer')
var ses = require('nodemailer-ses-transport')

var transporter = process.env.NODE_ENV === 'production'
  ? nodemailer.createTransport(ses({ accessKeyId: 'AWSACCESSKEY', secretAccessKey: 'AWS/Secret/key' }))
  : nodemailer.createTransport() // direct

exports.sendMail = function(options) {
  options.from = 'ARO <aro@altvil.com>';
  transporter.sendMail(options, function(error, info) {
    if (error) {
      return console.log(error);
    }
    // console.log('Message sent: ' + info.response);
  });
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
