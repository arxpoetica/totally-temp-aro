import nodemailer from 'nodemailer'
import ses from 'nodemailer-ses-transport'
import AWS from 'aws-sdk'
import config from './config.cjs'
import { createLogger, LOGGER_GROUPS } from './logger.cjs'
const logger = createLogger(LOGGER_GROUPS.EMAIL)

// Find the URL hostname. Cant use the NodeJS URL class because our container is at v6.11
const searchStr = '://'   // Can be http:// or https://
var APP_BASE_HOST = config.base_url.substr(config.base_url.indexOf(searchStr) + searchStr.length)
if (APP_BASE_HOST.indexOf(':') >= 0) {
  APP_BASE_HOST = APP_BASE_HOST.substr(0, APP_BASE_HOST.indexOf(':'))
}

var region = process.env.AWS_REGION
if (!region) {
  region = 'us-east-1'
  logger.warn(`NO AWS_REGION found. Using ${region}`)
}
AWS.config.update({ region: region })

var transporter = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
  ? nodemailer.createTransport(ses({ ses: new AWS.SES() }))
  : nodemailer.createTransport() // direct

export const sendMail = (options) => {
  options.from = `ARO <admin@${APP_BASE_HOST}>`
  return new Promise((resolve, reject) => {
    transporter.sendMail(options, (err, info) => {
      if (err) {
        reject(err)
        return logger.error(err)
      }
      logger.info('Message sent:')
      logger.info(info)
      resolve()
    })
  })
}
