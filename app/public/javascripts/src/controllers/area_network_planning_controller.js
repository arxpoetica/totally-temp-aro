/* global app swal $ config globalServiceLayers */
// Search Controller
app.controller('area-network-planning-controller', ['$scope', '$rootScope', '$http', '$q', 'map_tools', 'regions', 'optimization', ($scope, $rootScope, $http, $q, map_tools, regions, optimization) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.regions = regions

  // selected regions
  $scope.selectedRegions = []
  $rootScope.$on('regions_changed', () => {
    $scope.selectedRegions = regions.selectedRegions.slice(0)
  })
  $scope.removeGeography = (geography) => {
    regions.removeGeography(geography)
  }
  $scope.removeAllGeographies = () => {
    regions.removeAllGeographies()
  }
  // --

  $scope.entityTypes = [
    { id: 'optimizeSMB', value: 'SMB' },
    { id: 'optimizeMedium', value: 'Mid-tier' },
    { id: 'optimizeLarge', value: 'Large Enterprise' },
    { id: 'optimizeHouseholds', value: 'Residential' },
    { id: 'optimizeTowers', value: 'Cell Sites' }
  ]
  $scope.entityTypesTargeted = {}

  $scope.calculating = false

  $scope.optimizeHouseholds = true
  $scope.optimizeBusinesses = true
  $scope.optimizeSMB = true // special case
  $scope.optimizeTowers = true

  $scope.optimizationType = 'CAPEX'
  $scope.irrThreshold = $scope.irrThresholdRange = 10
  $scope.budget = 10000000
  $scope.technology = 'odn1'

  $scope.optimizationTypeOptions = []

  var budgetInput = $('#area_network_planning_controller input[name=budget]')
  budgetInput.val($scope.budget.toLocaleString())

  const parseBudget = () => +(budgetInput.val() || '0').match(/\d+/g).join('') || 0

  budgetInput.on('focus', () => {
    budgetInput.val(String(parseBudget()))
  })

  budgetInput.on('blur', () => {
    budgetInput.val(parseBudget().toLocaleString())
  })

  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan

    $scope.entityTypes.forEach((entity) => {
      $scope.entityTypesTargeted[entity.id] = true
    })
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

  var standardTypes = ['cma_boundaries', 'census_blocks', 'county_subdivisions']
  globalServiceLayers.forEach((layer) => {
    standardTypes.push(layer.name)
  })

  $scope.run = () => {
    var locationTypes = []
    var scope = config.ui.eye_checkboxes ? $rootScope : $scope

    if ($scope.optimizationMode === 'targets' && $scope.optimizationType === 'IRR') {
      scope = $scope.entityTypesTargeted
    }

    if (scope.optimizeHouseholds) locationTypes.push('household')
    if (scope.optimizeBusinesses) locationTypes.push('businesses')
    if (scope.optimizeMedium) locationTypes.push('medium')
    if (scope.optimizeLarge) locationTypes.push('large')
    if (scope.optimizeSMB) locationTypes.push('small')
    if (scope.optimize2kplus) locationTypes.push('mrcgte2000')
    if (scope.optimizeTowers) locationTypes.push('celltower')

    var processingLayers = [] // regions.getSelectedServiceAreas().map((layer) => layer.id)
    var algorithm = $scope.optimizationType
    var changes = {
      locationTypes: locationTypes,
      geographies: regions.selectedRegions.map((i) => {
        var info = { name: i.name, id: i.id, type: i.type, layerId: i.layerId }
        // geography information may be too large so we avoid to send it for known region types
        if (standardTypes.indexOf(i.type) === -1) {
          info.geog = i.geog
        }
        if (i.layerId) {
          processingLayers.push(i.layerId)
        }
        return info
      }),
      algorithm: $scope.optimizationType,
      budget: parseBudget(),
      irrThreshold: $scope.irrThreshold / 100,
      selectionMode: $scope.optimizationMode === 'boundaries' ? 'SELECTED_AREAS' : 'SELECTED_LOCATIONS'
      // processingLayers: regions.getSelectedServiceAreas().map((layer) => layer.id)
    }
    if (processingLayers.length > 0) {
      changes.processingLayers = processingLayers
    }

    if (algorithm === 'CAPEX') {
      algorithm = 'UNCONSTRAINED'
      delete changes.budget
      delete changes.irrThreshold
    } else if (algorithm === 'MAX_IRR') {
      delete changes.budget
      delete changes.irrThreshold
    } else if (algorithm === 'IRR') {
      delete changes.irrThreshold
    } else if (algorithm === 'BUDGET_IRR') {
    }

    changes.fiberNetworkConstraints = {
      useDirectRouting: $scope.technology === 'direct_routing'
    }

    canceler = optimization.optimize($scope.plan, changes, () => {
      $scope.calculating = false
    }, () => {
      $scope.calculating = false
    })
  }

  $scope.optimizationMode = optimization.getMode()
  $rootScope.$on('optimization_mode_changed', optimizationModeChanged)

  function optimizationModeChanged (e, mode) {
    $scope.optimizationMode = mode
    $scope.optimizationType = 'CAPEX'
    if (mode === 'targets') {
      $scope.optimizationTypeOptions = [
        { id: 'CAPEX', label: 'Full Coverage' },
        { id: 'IRR', label: 'Budget' }
      ]
    } else {
      $scope.optimizationTypeOptions = [
        { id: 'CAPEX', label: 'Full Coverage' },
        { id: 'MAX_IRR', label: 'Maximum IRR' },
        { id: 'IRR', label: 'Budget' },
        { id: 'BUDGET_IRR', label: 'IRR Target' }
        // { id: 'TARGET_IRR', label: 'IRR Target' },
        // { id: 'BUDGET_IRR', label: 'Budget and IRR Floor' }
      ]
    }
  }
  optimizationModeChanged(null, optimization.getMode())

  // processing layer
  $scope.allBoundaries = []
  $scope.selectedBoundary = null

  function loadBoundaries () {
    $http.get('/boundary/all')
      .success((response) => {
        $scope.allBoundaries = response
      })
  }

  loadBoundaries()
  $rootScope.$on('saved_user_defined_boundary', loadBoundaries)
}])
