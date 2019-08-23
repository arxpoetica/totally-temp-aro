class MenuAction {
  constructor (type, label, actionCreatorClass, actionCreatorMethod, ...payload) {
    this.type = type
    this.label = label
    this.actionCreatorClass = actionCreatorClass
    this.actionCreatorMethod = actionCreatorMethod
    this.payload = payload
  }
}

export default MenuAction
