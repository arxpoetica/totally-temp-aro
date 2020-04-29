'use strict'

var helpers = require('../helpers')
var database = helpers.database
var pify = require('pify')
var stringify = pify(require('csv-stringify'))

module.exports = class UiEtlTemplate {
  static getEtlTemplateNamesByType (dataType) {
    
    let clientName = process.env.ARO_CLIENT
    // 'aro' client is stored as 'default client' in client.cleint table
    if( clientName === 'aro')
      clientName = 'default client';
    console.log('client name:', clientName)

    const clientSql = 'SELECT id FROM client.client WHERE name=$1'
    return database.query(clientSql, [clientName])
      .then( results => {
        const clientId = parseInt(results[0].id)
        console.log('Client ID: ', clientId)
        const templateSql = 'SELECT etl_template.id, etl_template.name, etl_template.description, report.report_media_type.name AS type FROM ui.etl_template, report.report_media_type WHERE etl_template.client_id=$1 AND etl_template.data_type=$2 AND ui.etl_template.media_type = report.report_media_type.id'
        return database.query(templateSql, [clientId, dataType])
        .then( results =>{
          return Promise.resolve(results)
        })
      })
  }

  static getEtlTemplateFileText (templateId) {
    const templateSql = 'SELECT etl_template.name, etl_template.template, report.report_media_type.name AS type FROM ui.etl_template, report.report_media_type WHERE etl_template.id=$1 AND ui.etl_template.media_type = report.report_media_type.id'
    console.log(templateSql)
    return database.query(templateSql, [templateId])
    .then( results =>{
      return Promise.resolve(results[0])
    })
  }

}
