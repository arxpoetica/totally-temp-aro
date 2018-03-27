class EquipmentDetailModalController {

  constructor(state,configuration) {
    this.state = state
    this.configuration = configuration
    this.map_url = null
  
    $('#selected_equipment_modal').on('shown.bs.modal', (e) => {
      $('#selected_equipment_modal a[href="#selected_equipment_general"]').tab('show')
      this.showCurrentTab()
    })
  
    $('#selected_equipment_modal').on('shown.bs.tab', (e) => {
      this.showCurrentTab()
    })
  
  }

  setSelectedLocation (equipment) {
    
    this.equipment = equipment

    var google_maps_key = this.configuration.google_maps_key
    var coordinates = equipment.geog.coordinates[1] + ',' + equipment.geog.coordinates[0]
    var params = {
      center: coordinates,
      zoom: 13,
      size: '434x110',  // We want an image with size '868x220' but our free license only allows a max size of 640x640
      scale: 2,         // So we set scale = 2 and size of '434x110'
      maptype: 'roadmap',
      markers: 'color:red|label:E|' + coordinates,
      key: google_maps_key
    }
    this.map_url = 'https://maps.googleapis.com/maps/api/staticmap?' +
      _.keys(params).map((key) => key + '=' + encodeURIComponent(params[key])).join('&')

  }

  showCurrentTab () {
    var href = $('#selected_equipment_modal .nav-pills > .active a').attr('href')
    if (href === '#selected_equipment_general') {

    } else if (href === '#selected_equipment_coverage') {

    } 
  }

  modalHide() {
    this.showDetailModal = false
  }

  $onInit() {
    this.showDetailedEquipmentInfoObserver = this.state.showDetailedEquipmentInfo
    .subscribe((equipmentInfo) => {
      if(!equipmentInfo) return
      this.showDetailModal = true
      this.setSelectedLocation(equipmentInfo)
      $("#selected_equipment_modal > .modal-dialog").css("width","900")

      $('#selected_equipment_modal .nav-pills a').click((e) => {
        e.preventDefault()
        $(this).tab('show')
      })
    })
  }

  $onDestroy() {
    this.showDetailedEquipmentInfoObserver.unsubscribe();
  }

}

EquipmentDetailModalController.$inject = ['state','configuration']

let equipmentDetailModal = {
  templateUrl: '/components/sidebar/view/equipment-detail-modal.html',
  bindings: {},
  controller: EquipmentDetailModalController
}

export default equipmentDetailModal
