export const MenuActionTypes = Object.freeze({
  ADD_BOUNDARY: 'ADD_BOUNDARY',
  SELECT: 'SELECT',
  VIEW: 'VIEW',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  MERGE_LOCATION_CONNECTORS: 'MERGE_LOCATION_CONNECTORS'
})

export default class MenuAction {
  constructor (type, callback) {
    this.type = type
    this.callback = callback
  }
}
