import database from '../helpers/database.cjs'

class Authentication {

  static getConfig(authName) {
    const sql = `
      SELECT ea.config
      FROM auth.external_auth ea
      JOIN auth.external_auth_type eat
      ON ea.auth_type_id = eat.id
      WHERE eat.name = $1;
    `
    return database.query(sql, [authName])
      .then((result) => {
        // NOTE: Can return null if we don't have a config
        return Promise.resolve(result && (result.length > 0) && result[0].config)
      })
      .catch((err) => console.error(err))
  }
}

export default Authentication
