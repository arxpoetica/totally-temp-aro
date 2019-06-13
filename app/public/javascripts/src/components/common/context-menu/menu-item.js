export const MenuItemTypes = Object.freeze({
  BOUNDARY: 'BOUNDARY',
  EQUIPMENT: 'EQUIPMENT',
  LOCATION: 'LOCATION',
  SERVICE_AREA: 'SERVICE_AREA'
})

export default class MenuItem {
  constructor (type, displayName, actions, feature) {
    this.type = type
    this.displayName = displayName
    this.actions = actions
    this.feature = feature
  }
}
