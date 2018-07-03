class MapToggleController {
  constructor($document){
    this.map = map;
    this.buttonIcon = this.map.mapTypeId === 'satellite' ? 'fa-globe' : 'fa-road'
  }

  toggle(){
    this.map.mapTypeId === 'satellite' ? this.toStreets() : this.toStatellite()
  }

  toStatellite() {
    this.map.setMapTypeId('satellite')
    this.buttonIcon = 'fa-globe'
  }

  toStreets(){
    this.map.setMapTypeId('roadmap')
    this.buttonIcon = 'fa-road'
  }
}

MapToggleController.$inject = ['$document']

let mapToggle = {
  template:'<button class="map-toggle" ng-click="$ctrl.toggle()"><i class="fa {{$ctrl.buttonIcon}}"></i></button>',
  bindings: {},
  controller:MapToggleController
};

export default mapToggle