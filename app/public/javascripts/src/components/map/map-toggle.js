class MapToggleController {
  constructor($document) {
    this.mapRef = null
    this.$document = $document
    // Hold a map of 'mapTypeId' in state.js to the fontawesome icons
    this.buttonIcons = {
      hybrid: 'fa-globe',
      roadmap: 'fa-road'
    }
  }

  toggle(){
    const newMapTypeId = (this.mapTypeId === 'hybrid') ? 'roadmap' : 'hybrid'
    this.setMapTypeId && this.setMapTypeId({ mapTypeId: newMapTypeId })
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
    if (changesObj && changesObj.mapTypeId) {
      if (this.mapRef) {  // Make sure mapRef has been initialized
        this.mapRef.setMapTypeId(changesObj.mapTypeId.currentValue)
      }
    }
  }
}

MapToggleController.$inject = ['$document']

let mapToggle = {
  template:'<button class="map-toggle" ng-click="$ctrl.toggle()"><i class="fa {{$ctrl.buttonIcons[$ctrl.mapTypeId]}}"></i></button>',
  bindings: {
    mapGlobalObjectName: '@',
    mapTypeId: '<',
    setMapTypeId: '&'
  },
  controller:MapToggleController
};

export default mapToggle