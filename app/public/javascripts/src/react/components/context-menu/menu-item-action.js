class MenuAction {
  constructor (type, label, action) {
    this.type = type
    this.label = label
    this.action = action
    if (typeof action !== 'object') {
      throw new Error('MenuItem classes must be serializable. The action property must be a POJO and not an action creator')
    }
  }
}

export default MenuAction
