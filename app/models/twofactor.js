var helpers = require('../helpers')
var database = helpers.database
const otplib = require('otplib')
const qrcode = require('qrcode')

module.exports = class TwoFactor {

  // Generates a QR code from an input string
  static getQrCodeForKeyUri(keyUri) {
    return new Promise((resolve, reject) => {
      qrcode.toDataURL(keyUri, (err, imageUrl) => {
        if (err) {
          reject('Unable to generate QR code')
        }
        resolve(imageUrl)
      })
    })
  }

  // Generates a TOTP secret for a given user and saves it in the database
  static overwriteTOTPSecretForUser(userId) {
    // Generate a secret for the logged in user, save it in the db
    // otplib.authenticator.options = { encoding: 'ascii' }
    const userSecret = otplib.authenticator.generateSecret()
    return database.query('SELECT first_name, last_name FROM auth.users WHERE id = $1', [userId])
      .then(result => {
        console.log(process.env.ARO_CLIENT)
        const userName = `${result[0].first_name} ${result[0].last_name}`
        const authClient = `ARO - ${process.env.ARO_CLIENT}`  // This string will show up in authenticator apps like Google Authenticator
        const uriForQRCode = otplib.authenticator.keyuri(userName, authClient, userSecret)
        const updateSql = 'UPDATE auth.users SET totp_secret = $1, is_totp_verified = false, is_totp_enabled = false WHERE id = $2'
        return Promise.all([
          this.getQrCodeForKeyUri(uriForQRCode),
          database.query(updateSql, [userSecret, userId])
        ])
      })
      .then(results => {
        return Promise.resolve({
          secret: userSecret,
          qrCode: results[0]    // A QR code that we can scan in apps like Google Authenticator
        })
      })
  }

  // Returns the status of the TOTP settings for a given user id
  static getTotpStatus(userId) {
    const sql = 'SELECT is_totp_verified, is_totp_enabled FROM auth.users WHERE id = $1'
    return database.query(sql, [userId])
  }
}
