/* global app swal $ config globalServiceLayers _ */
// Search Controller
app.controller('area-network-planning-controller', ['$scope', '$rootScope', '$http', '$q', 'map_tools', 'regions', 'optimization', ($scope, $rootScope, $http, $q, map_tools, regions, optimization) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.regions = regions
  $scope.ARO_CLIENT = config.ARO_CLIENT

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
    { id: 'optimizeSMB', value: 'SMB', name: 'small' },
    { id: 'optimizeMedium', value: 'Mid-tier', name: 'medium' },
    { id: 'optimizeLarge', value: 'Large Enterprise', name: 'large' },
    { id: 'optimizeHouseholds', value: 'Residential', name: 'household' },
    { id: 'optimizeTowers', value: 'Cell Sites', name: 'celltower' }
  ]

  $scope.technologyTypes = [
      {id:'Fiber' , label : 'Fiber' , selected :true},
      {id:'FiveG' , label : 'Fixed Wireless'}
  ]

  $scope.cellNodeConstraints = {
      cellGranularityRatio : 0,
      cellRadius: config.ui.map_tools.area_planning.cell_radius
  }
  $scope.coverageThreshold = config.ui.map_tools.area_planning.coverage_threshold;
  $scope.entityTypesTargeted = {}

  $scope.calculating = false

  $scope.optimizeHouseholds = true
  $scope.optimizeBusinesses = false
  $scope.optimizeLarge = true
  $scope.optimizeMedium = true
  $scope.optimizeSMB = true // special case
  $scope.optimizeTowers = true
  $scope.optimizeUploaded = false

  $scope.optimizationType = 'CAPEX'
  $scope.irrThreshold = $scope.irrThresholdRange = 10
  $scope.budget = 10000000
  $scope.technology = 'direct_routing' // 'odn1'

  $scope.routeGenerationOptions = [
    { id: 'T', value: 'A Route' },
    { id: 'A', value: 'B Route' },
    { id: 'B', value: 'C Route' },
    { id: 'C', value: 'D Route' }
  ]
  $scope.routeGenerationOptionsValues = {}

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

    if (plan) {
      $scope.reportName = plan.name
      var optimizationType = plan.optimization_type
      if (!optimizationType || optimizationType === 'UNCONSTRAINED') optimizationType = 'CAPEX'
      $scope.optimizationType = optimizationType
    }

    $scope.routeGenerationOptions.forEach((option) => {
      $scope.routeGenerationOptionsValues[option.id] = true
    })

    $scope.entityTypes.forEach((entity) => {
      $scope.entityTypesTargeted[entity.id] = true
    })
  })

  $scope.routeGenerationOptionsChanged = (id) => {
    if ($scope.routeGenerationOptionsValues[id]) {
      // check all above
      $scope.routeGenerationOptions.some((option) => {
        if (option.id === id) return true
        $scope.routeGenerationOptionsValues[option.id] = true
        return false
      })
    } else {
      // uncheck all below
      $scope.routeGenerationOptions.slice(0).reverse().some((option) => {
        if (option.id === id) return true
        $scope.routeGenerationOptionsValues[option.id] = false
        return false
      })
    }
  }

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
      canceler && canceler.resolve()
      canceler = null
      $http.post(`/optimization/stop/${$scope.plan.id}`)
        .success((response) => {
          console.log('stopped')
        })
    })
  }

  var standardTypes = ['cma_boundaries', 'census_blocks', 'county_subdivisions', 'user_defined']
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
    if (scope.optimizeBusinesses) {
      // locationTypes.push('businesses')
      locationTypes.push('large')
      locationTypes.push('medium')
    }
    if (scope.optimizeMedium) locationTypes.push('medium')
    if (scope.optimizeLarge) locationTypes.push('large')
    if (scope.optimizeSMB) locationTypes.push('small')
    if (scope.optimize2kplus) locationTypes.push('mrcgte2000')
    if (scope.optimizeTowers) locationTypes.push('celltower')

    optimization.datasources = [];
    if(locationTypes.length > 0){
      optimization.datasources.push(1);
    }

    if(scope.optimizeUploaded){
      var uploadedCustomersSelect = $(".uploadCustomersAreaPlanning")
      var selectedDatasources = uploadedCustomersSelect.select2('val')

      var dataSources = [];
      dataSources = dataSources.concat(selectedDatasources)
      var posSources = dataSources.map((id) => +id);
      optimization.datasources = _.uniq(optimization.datasources.concat(posSources));
    }


    var processingLayers = []
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
    }
    if ($rootScope.selectedUserDefinedBoundary) {
      processingLayers.push($rootScope.selectedUserDefinedBoundary.id)
    }
    if (processingLayers.length > 0) {
      changes.processingLayers = _.uniq(processingLayers)
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
    } else if (algorithm === 'TABC') {
      delete changes.budget
      delete changes.irrThreshold
      var values = $scope.routeGenerationOptionsValues
      var generations = Object.keys(values).filter((id) => values[id])
      changes.customOptimization = {
        name: 'TABC',
        map: {
          generations: generations.join(',')
        }
      }
    }else if(algorithm === "DEFAULT"){
      delete changes.budget
      delete changes.irrThreshold

      changes.customOptimization = {
        coverage_threshold : $scope.coverageThreshold
      }
    }

    changes.fiberNetworkConstraints={};
    changes.networkTypes = [];

      switch ($scope.technology){
          case "direct_routing" :  changes.fiberNetworkConstraints.routingMode = "DIRECT_ROUTING";
              break;
          case "odn1": changes.fiberNetworkConstraints.routingMode = "ODN_1";
              break;
          case "odn2": changes.fiberNetworkConstraints.routingMode = "ODN_2";
              break;
      }


     changes.networkTypes = $scope.selectedTechType;
    if($scope.selectedTechType.indexOf("FiveG")!=-1){
        if($scope.cellNodeConstraints.cellRadius == ""){
            $scope.cellNodeConstraints.cellRadius = config.ui.map_tools.area_planning.cell_radius;
        }

        changes.fiberNetworkConstraints.cellNodeConstraints = {
            cellRadius : $scope.cellNodeConstraints.cellRadius
        };
    }

    var selectLocationTypes = []
    if ($scope.optimizationMode === 'targets' && $scope.optimizationType === 'IRR') {
      selectLocationTypes = Object.keys($scope.entityTypesTargeted)
        .map((key) => {
          return $scope.entityTypesTargeted[key]
            ? $scope.entityTypes.find((type) => type.id === key).name
            : null
        })
        .filter((val) => val)
    }

    if ($scope.selectedBoundary) {
      changes.processingLayers = [$scope.selectedBoundary.id]
    }

    $scope.selectLocationTypes = selectLocationTypes
    canceler = optimization.optimize($scope.plan, changes)
  }

  $rootScope.$on('optimization_started_polling', () => {
    $scope.calculating = true
    if ($scope.selectLocationTypes && $scope.selectLocationTypes.length > 0) {
      $rootScope.$broadcast('select_locations', $scope.selectLocationTypes)
    }
  })

  $rootScope.$on('optimization_stopped_polling', () => {
    $scope.calculating = false
    $scope.selectLocationTypes = null
  })

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
      ]
      if (config.ARO_CLIENT === 'verizon') {
        $scope.optimizationTypeOptions.push({ id: 'TABC', label: 'ABCD analysis' })
      }
      // { id: 'TARGET_IRR', label: 'IRR Target' },
      // { id: 'BUDGET_IRR', label: 'Budget and IRR Floor' }
    }

    $scope.optimizationTypeOptions.push({ id: 'DEFAULT', label: 'Coverage Target' });
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

  $scope.selectedTechType = ['Fiber'];
  $scope.toggleTechType = function (type , checked) {
    if(checked){
      $scope.selectedTechType.push(type);
    }else{
      $scope.selectedTechType.splice($scope.selectedTechType.indexOf(type) , 1);
    }
  };
  loadBoundaries()
  $rootScope.$on('saved_user_defined_boundary', loadBoundaries)
}])
