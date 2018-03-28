class LocationProperties {
  constructor() {
    this.locationTypes = ['Household']
    this.selectedLocationType = this.locationTypes[0]
    this.numberOfLocations = 1
  }
}

class LocationEditorController {
  constructor($timeout) {
    this.$timeout = $timeout
    this.selectedMapObject = null
    this.objectIdToProperties = {}
    this.currentTransaction = 1
  }

  handleObjectCreated(mapObject) {
    this.objectIdToProperties[mapObject.objectId] = new LocationProperties()
    this.$timeout()
  }

  handleSelectedObjectChanged(mapObject) {
    this.selectedMapObject = mapObject
    this.$timeout()
  }
}

LocationEditorController.$inject = ['$timeout']

let locationEditor = {
  templateUrl: '/components/sidebar/view/location-editor.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: LocationEditorController
}

export default locationEditor