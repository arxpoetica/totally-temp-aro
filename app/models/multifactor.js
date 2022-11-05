import otplib from 'otplib'
import qrcode from 'qrcode'
import crypto from 'crypto'
import base32Encode from 'base32-encode'
import database from '../helpers/database.cjs'
import { sendMail } from '../helpers/mail.js'

otplib.authenticator.options = {
  window: [1, 0]  // Allow OTP from one previous timestep, in case it changes just as the user is typing it
}

export default class MultiFactor {

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
        if (isValid) {
          return Promise.resolve('OTP code was verified successfully')
        } else {
          return Promise.reject({
            status: 412,
            body: 'Incorrect OTP code. If you are using an authenticator app, please make sure the time on your device is correct'
          })
        }
      })
  }

  // Sets the TOTP verified flag = true for a given user
  static setTotpVerifiedFlag(userId, value) {
    return database.query('UPDATE auth.users SET is_totp_verified = $2 WHERE id = $1', [userId, value])
  }

  // Sets the TOTP enabled flag = true for a given user
  static enableTotp(userId) {
    return database.findOne('SELECT is_totp_verified FROM auth.users WHERE id = $1', [userId])
      .then(result => {
        if (!result.is_totp_verified) {
          return Promise.reject(`TOTP is not verified for user id ${userId}, so we cannot enable it.`)
        } else {
          return database.query('UPDATE auth.users SET is_totp_enabled = true WHERE id = $1', [userId])
        }
      })
  }

  // Deletes the TOTP settings for a user
  static deleteTotpSettingsForUser(userId, verificationCode) {
    // Make sure we have a current valid code before disabling multi-factor
    return MultiFactor.verifyTotp(userId, verificationCode)
      .then(result => database.query('UPDATE auth.users SET totp_secret = \'\', is_totp_enabled = false, is_totp_verified = false WHERE id = $1', [userId]))
      .then(() => Promise.resolve({ result: 'success', message: 'OTP settings successfully deleted for user'}))
  }

  // Sends an email to a user with the currently valid totp
  static sendTotpByEmail(userId) {
    return database.findOne('SELECT email, totp_secret FROM auth.users WHERE id = $1', [userId])
      .then(user => {
        const currentToken = otplib.authenticator.generate(user.totp_secret)
        var text = [
          `You're receiving this email because someone (hopefully you) `,
          `requested a One-Time Password (OTP) to be sent to this email address.`,
          `\n\nYour One-Time Password (OTP) to access the ARO application is: ${currentToken}`,
          `\nThis OTP is valid for 30 seconds.`,
          `\n\nIf you did not request this OTP, you do not need to do anything. `,
          `If you want, you can reset your password by logging into the ARO application.`,
          `\n\nPlease do not reply to this email. It was automatically generated.`,
        ].join('')
        sendMail({
          subject: 'One time password (OTP): ARO Application',
          to: user.email,
          text: text
        })
        console.log('************************************** OTP email **************************************')
        console.log(`Sent to: ${user.email}`)
        console.log(text)
      })
  }
}
