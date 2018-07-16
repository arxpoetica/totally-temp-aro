class MapToggleController {
  constructor($document){
    this.map = map;
    this.buttonIcon = this.map.mapTypeId === 'hybrid' ? 'fa-globe' : 'fa-road'
  }

  toggle(){
    this.map.mapTypeId === 'hybrid' ? this.toStreets() : this.toStatellite()
  }

  toStatellite() {
    this.map.setMapTypeId('hybrid')
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