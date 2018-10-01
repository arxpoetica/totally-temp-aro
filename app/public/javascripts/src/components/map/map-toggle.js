class MapToggleController {
  constructor($document, configuration) {
    this.mapRef = null
    this.$document = $document
    this.configuration = configuration
    // Hold a map of 'mapTypeId' in state.js to the fontawesome icons
    this.buttonIcons = {
      hybrid: 'fa-globe',
      roadmap: 'fa-road'
    }
    this.currentMapType = 'roadmap'
    this.overridenMapType = null    // Used if the user manually clicks on a map type
  }

  toggle() {
    this.currentMapType = (this.currentMapType === 'hybrid') ? 'roadmap' : 'hybrid'
    this.overridenMapType = this.currentMapType
    this.mapRef.setMapTypeId(this.currentMapType)
  }

  updateMapType() {
    if (!this.mapRef) {
      return  // Need a map ref object to set the type
    }
    if (this.overridenMapType) {
      // The user has overriden the map type. Use it.
      this.mapRef.setMapTypeId(this.overridenMapType)
    } else {
      // Depending upon the user perspective, set the map type on the map object
      this.currentMapType = this.configuration.mapType[this.userPerspective] || this.configuration.mapType.default
      this.mapRef.setMapTypeId(this.currentMapType)
    }
  }

  $onInit() {
    this.$document.ready(()=>{
      if (!this.mapGlobalObjectName) {
        console.error('ERROR: You must specify the name of the global variable that contains the map object.')
      }
  
      // We should have a map variable at this point
      this.mapRef = window[this.mapGlobalObjectName]
    })
  }

  $onChanges(changesObj) {
    if (changesObj && changesObj.userPerspective) {
      // User perspective has changed. Set the overriden configuration to null
      this.overridenMapType = null
      this.updateMapType()
    }
  }
}

MapToggleController.$inject = ['$document', 'configuration']

let mapToggle = {
  template:'<button class="map-toggle" ng-click="$ctrl.toggle()"><i class="fa {{$ctrl.buttonIcons[$ctrl.currentMapType]}}"></i></button>',
  bindings: {
    mapGlobalObjectName: '@',
    userPerspective: '<'
  },
  controller:MapToggleController
};

export default mapToggle