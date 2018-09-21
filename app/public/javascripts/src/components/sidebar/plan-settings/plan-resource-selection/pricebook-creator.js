class PriceBookCreatorController {
  constructor($http, $timeout, state) {
    this.$timeout = $timeout
    this.state = state
    this.priceStrategies = []
    this.selectedPriceStrategy = null
    $http.get('/service/v1/pricebook-strategies')
      .then((result) => {
        this.priceStrategies = result.data
        this.selectedPriceStrategy = this.priceStrategies[0]
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  onHideModal() {
    this.state.showPriceBookCreator = false
  }

  close() {
    this.state.showPriceBookCreator = false
  }
  // $onInit() {
  //   this.$element.find('#plan_inputs_modal > .modal-dialog').css('width', '350')
  // }
}

PriceBookCreatorController.$inject = ['$http', '$timeout', 'state']

let priceBookCreator = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/pricebook-creator.html',
  bindings: {},
  controller: PriceBookCreatorController
}

export default priceBookCreator