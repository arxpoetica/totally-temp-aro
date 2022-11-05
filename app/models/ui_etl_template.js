import database from '../helpers/database.cjs'

export default class UiEtlTemplate {
  static getEtlTemplateNamesByType (dataType) {
    
    return this.getClientId()
    .then( clientId => {
        console.log('Client ID: ', clientId)
        const templateSql = 'SELECT etl_template.id, etl_template.name, etl_template.description, report.report_media_type.name AS type, etl_template.data_type FROM ui.etl_template, report.report_media_type WHERE etl_template.client_id=$1 AND etl_template.data_type=$2 AND ui.etl_template.media_type = report.report_media_type.id'
        return database.query(templateSql, [clientId, dataType])
        .then( results =>{
          // if the client is not ARO and we don't find any
          // template overrides then we have to return ARO/base templates
          console.log(results)
          const aroClientId = 1
          if(clientId != aroClientId && results.length == 0) {
            return database.query(templateSql, [aroClientId, dataType])
            .then( results =>{
              return Promise.resolve(results)
            })
          } 
          else
            return Promise.resolve(results)
        })
      })
  }

  static getEtlTemplateFileText (templateId) {
    const templateSql = 'SELECT etl_template.name, etl_template.template, report.report_media_type.name AS type FROM ui.etl_template, report.report_media_type WHERE etl_template.id=$1 AND ui.etl_template.media_type = report.report_media_type.id'
    return database.query(templateSql, [templateId])
    .then( results =>{
      return Promise.resolve(results[0])
    })
  }

  static addEtlTemplate (dataType, name, description, mediaType, template) {
    return this.getClientId()
    .then( clientId => {
      const templateSql = 'insert into ui.etl_template (client_id, data_type, name, description, media_type, template) values($1, $2, $3, $4, $5, $6 )'
      console.log("ClientId: ", clientId)
      return database.query(templateSql, [clientId, dataType, name, description, mediaType, template ])
      .then( results =>{
        return Promise.resolve(true)
      })
    })
  }

  static getClientId(clientNameOverride) {
    let clientName = clientNameOverride ? clientNameOverride : process.env.ARO_CLIENT
    // 'aro' client is stored as 'default client' in client.cleint table
    if( clientName === 'aro')
      clientName = 'default client';

    const clientSql = 'SELECT id FROM client.client WHERE name=$1'
    return database.query(clientSql, [clientName])
    .then(results => {
      if (results && results.length > 0) {
        return parseInt(results[0].id)
      } else {
        return this.getClientId('aro')
      }
    })
  }

  static deleteEtlTemplate (templateId) {
    const templateSql = 'DELETE FROM ui.etl_template WHERE ui.etl_template.id=$1'
    return database.query(templateSql, [templateId])
  }
}
