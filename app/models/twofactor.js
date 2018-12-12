var helpers = require('../helpers')
var database = helpers.database
const otplib = require('otplib')
const qrcode = require('qrcode')
const crypto = require('crypto')
const base32Encode = require('base32-encode')

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
    // Generate a secret for the logged in user. RFC6238 has a length of 20 bytes in the sample implementation.
    // This is also the recommended length in the Google Authenticator app, so we will go with this for now.
    const SECRET_KEY_LENGTH_BYTES = 20
    const userSecret = base32Encode(crypto.randomBytes(SECRET_KEY_LENGTH_BYTES), 'RFC4648')
    return database.query('SELECT first_name, last_name FROM auth.users WHERE id = $1', [userId])
      .then(result => {
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

  // Verifies the TOTP for a given user
  static verifyTotp(userId, verificationCode) {
    return database.query('SELECT totp_secret FROM auth.users WHERE id = $1', [userId])
      .then(res => {
        const totpSecret = res[0].totp_secret
        const isValid = otplib.authenticator.check(verificationCode, totpSecret)
        return isValid ? Promise.resolve() : Promise.reject('OTP code was invalid')
      })
  }
}
