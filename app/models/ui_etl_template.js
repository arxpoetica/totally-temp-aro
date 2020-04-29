'use strict'

var helpers = require('../helpers')
var database = helpers.database
var pify = require('pify')
var stringify = pify(require('csv-stringify'))

module.exports = class UiEtlTemplate {
  static getEtlTemplatesByType (dataType) {
    
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
        const templateSql = 'SELECT name, template FROM ui.etl_template WHERE client_id=$1 AND data_type=$2'
        return database.query(templateSql, [clientId, dataType])
        .then( results =>{
          return Promise.resolve(results)
        })
      })
  }
}
