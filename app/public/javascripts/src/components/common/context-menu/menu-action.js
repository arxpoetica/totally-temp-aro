export const MenuActionTypes = Object.freeze({
  ADD_BOUNDARY: 'ADD_BOUNDARY',
  SELECT: 'SELECT',
  VIEW: 'VIEW',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  EDIT_LOCATION_CONNECTORS: 'EDIT_LOCATION_CONNECTORS'
})

export default class MenuAction {
  constructor (type, callback) {
    this.type = type
    this.callback = callback
  }
}
