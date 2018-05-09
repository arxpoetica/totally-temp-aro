class MapToggleController {
  constructor($document){
    this.buttonIcon = 'fa-road'
    this.map = map;

    this.isToggled = false
  }

  toggle(){
    this.isToggled = !this.isToggled
    this.isToggled ? this.toStatellite() : this.toStreets()
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