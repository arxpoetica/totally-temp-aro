export const MenuActionTypes = Object.freeze({
  ADD: 'ADD',
  SELECT: 'SELECT',
  VIEW: 'VIEW',
  EDIT: 'EDIT',
  DELETE: 'DELETE'
})

export default class MenuAction {
  constructor (type, callback) {
    this.type = type
    this.callback = callback
  }
}
