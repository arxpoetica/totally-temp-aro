// Permission

import database from '../helpers/database.cjs'

export default class Permission {

  static grantAccess (plan_id, user_id, rol) {
    return Promise.resolve()
      .then(() => (
        database.execute('DELETE FROM auth.permissions WHERE plan_id=$1 AND user_id=$2',
          [plan_id, user_id])
      ))
      .then(() => (
        database.execute('INSERT INTO auth.permissions (plan_id, user_id, rol) VALUES ($1, $2, $3)',
          [plan_id, user_id, rol])
      ))
  }

  static findPermission (project_id, user_id) {
    return database.findOne('select auth_role.name as rol from aro_core.project_user ' +
    'JOIN aro_core.auth_role ON project_user.role_id = auth_role.id ' +
    'where project_id =$1  and user_id =$2',[project_id, user_id])  
  }

}
