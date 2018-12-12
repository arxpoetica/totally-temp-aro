var helpers = require('../helpers')
var database = helpers.database
const otplib = require('otplib')
const qrcode = require('qrcode')

module.exports = class TwoFactor {

  static getQrCodeForSecret(secret) {
    return new Promise((resolve, reject) => {
      qrcode.toDataURL(secret, (err, imageUrl) => {
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
    const userSecret = otplib.authenticator.generateSecret()
    const sql = 'UPDATE auth.users SET totp_secret = $1, is_totp_verified = false, is_totp_enabled = false WHERE id = $2'
    return Promise.all([this.getQrCodeForSecret(userSecret), database.query(sql, [userSecret, userId])])
      .then(results => {
        return Promise.resolve({
          secret: userSecret,
          qrCode: results[0]
        })
      })
  }

  // Returns the status of the TOTP settings for a given user id
  static getTotpStatus(userId) {
    const sql = 'SELECT is_totp_verified, is_totp_enabled FROM auth.users WHERE id = $1'
    return database.query(sql, [userId])
  }
}
