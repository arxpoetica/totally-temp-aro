class MenuAction {
  constructor (type, label, actionCreatorClass, actionCreatorMethod, repeatable, ...payload) {
    this.type = type
    this.label = label
    this.actionCreatorClass = actionCreatorClass
    this.actionCreatorMethod = actionCreatorMethod
    this.repeatable = repeatable
    this.payload = payload
  }
}

export default MenuAction
