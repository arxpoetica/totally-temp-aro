class MapToggleController {
  constructor ($document, state) {
    this.mapRefPromise = null
    this.$document = $document
    this.state = state
    // Hold a map of 'mapTypeId' in state.js to the fontawesome icons
    this.buttonIcons = {
      hybrid: 'fa-globe',
      roadmap: 'fa-road'
    }
    this.currentMapType = 'roadmap'
    this.overridenMapType = null // Used if the user manually clicks on a map type
  }

  $onInit () {
    this.ensureMapRefPromiseCreated()
  }

  ensureMapRefPromiseCreated () {
    if (!this.mapRefPromise) {
      this.mapRefPromise = new Promise((resolve, reject) => {
        this.$document.ready(() => {
          if (!this.mapGlobalObjectName) {
            reject('ERROR: You must specify the name of the global variable that contains the map object.')
          }

          // We should have a map variable at this point
          resolve(window[this.mapGlobalObjectName])
        })
      })
    }
  }

  toggle () {
    this.currentMapType = (this.currentMapType === 'hybrid') ? 'roadmap' : 'hybrid'
    this.overridenMapType = this.currentMapType
    this.mapRefPromise
      .then((mapRef) => mapRef.setMapTypeId(this.currentMapType))
      .catch((err) => console.log(err))
  }

  updateMapType () {
    if (this.overridenMapType) {
      // The user has overriden the map type. Use it.
      this.mapRefPromise
        .then((mapRef) => mapRef.setMapTypeId(this.overridenMapType))
        .catch((err) => console.log(err))
    } else {
      // Depending upon the user perspective, set the map type on the map object
      this.mapRefPromise
        .then((result) => {
          const mapRef = result
          this.currentMapType = 'roadmap'
          if (this.state.configuration.mapType) {
            this.currentMapType = this.state.configuration.mapType[this.userPerspective] || this.state.configuration.mapType.default
          }
          mapRef.setMapTypeId(this.currentMapType)
        })
        .catch((err) => console.log(err))
    }
  }

  $onChanges (changesObj) {
    if (changesObj && changesObj.userPerspective) {
      // User perspective has changed. Set the overriden configuration to null
      this.overridenMapType = null
      this.ensureMapRefPromiseCreated() // In case it has not been created yet
      this.updateMapType()
    }
  }
}

MapToggleController.$inject = ['$document', 'state']

let mapToggle = {
  template: '<button class="map-toggle" ng-click="$ctrl.toggle()"><i class="fa {{$ctrl.buttonIcons[$ctrl.currentMapType]}}"></i></button>',
  bindings: {
    mapGlobalObjectName: '@',
    userPerspective: '<'
  },
  controller: MapToggleController
}

export default mapToggle
