/* global app swal $ config */
// Search Controller
app.controller('area-network-planning-controller', ['$scope', '$rootScope', '$http', '$q', 'map_tools', 'regions', ($scope, $rootScope, $http, $q, map_tools, regions) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.regions = regions

  $scope.selectedRegions = []

  $rootScope.$on('regions_changed', () => {
    $scope.selectedRegions = regions.selectedRegions.slice(0)
    // if (!$scope.$$phase) { $scope.$apply() } // refresh button state
  })

  $scope.calculating = false

  $scope.optimizeHouseholds = true
  $scope.optimizeBusinesses = true
  $scope.optimizeSMB = true // special case
  $scope.optimizeTowers = true

  $scope.optimizationType = 'CAPEX'
  $scope.irrThreshold = $scope.irrThresholdRange = 10
  $scope.budget = 10000000

  var budgetInput = $('#area_network_planning_controller input[name=budget]')
  budgetInput.val($scope.budget.toLocaleString())

  const parseBudget = () => +(budgetInput.val() || '0').match(/\d+/g).join('') || 0

  budgetInput.on('focus', () => {
    budgetInput.val(String(parseBudget()))
  })

  budgetInput.on('blur', () => {
    budgetInput.val(parseBudget().toLocaleString())
  })

  $scope.removeGeography = (geography) => {
    regions.removeGeography(geography)
  }

  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
  })

  $scope.irrThresholdRangeChanged = () => {
    $scope.irrThreshold = +$scope.irrThresholdRange
  }

  $scope.irrThresholdChanged = () => {
    $scope.irrThresholdRange = $scope.irrThreshold
  }

  var canceler = null
  $scope.cancel = () => {
    swal({
      title: 'Are you sure?',
      text: 'Are you sure you want to cancel?',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'Keep Going',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      canceler.resolve()
      canceler = null
    })
  }

  $scope.run = () => {
    var locationTypes = []
    var scope = config.ui.eye_checkboxes ? $rootScope : $scope
    if (scope.optimizeHouseholds) locationTypes.push('households')
    if (scope.optimizeBusinesses) locationTypes.push('businesses')
    if (scope.optimizeSMB) locationTypes.push('smb')
    if (scope.optimizeTowers) locationTypes.push('towers')

    var algorithm = $scope.optimizationType
    var changes = {
      locationTypes: locationTypes,
      geographies: $scope.selectedRegions.map((i) => ({ geog: i.geog, name: i.name, id: i.id, type: i.type })),
      algorithm: $scope.optimizationType,
      budget: parseBudget(),
      irrThreshold: $scope.irrThreshold / 100
    }

    if (algorithm === 'CAPEX') {
      delete changes.budget
      delete changes.irrThreshold
    } else if (algorithm === 'MAX_IRR') {
      delete changes.budget
      delete changes.irrThreshold
    } else if (algorithm === 'IRR') {
      delete changes.irrThreshold
    } else if (algorithm === 'BUDGET_IRR') {
    }

    canceler = $q.defer()
    var url = '/network_plan/' + $scope.plan.id + '/edit'
    var options = {
      url: url,
      method: 'post',
      saving_plan: true,
      data: changes,
      timeout: canceler.promise
    }
    $scope.calculating = true
    $http(options)
      .success((response) => {
        $scope.calculating = false
        $rootScope.$broadcast('route_planning_changed', response)
      })
      .error(() => {
        $scope.calculating = false
      })
  }
}])
