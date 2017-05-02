/* global app localStorage map */
app.service('state', ['$rootScope', 'map_layers', 'configuration', 'regions', 'optimization', ($rootScope, map_layers, configuration, regions, optimization) => {
  var key = null
  var state = null;
  var service = {}
  service.INVALID_PLAN_ID = -1;
  service.DS_GLOBAL_BUSINESSES = -3;
  service.DS_GLOBAL_HOUSEHOLDS = -2;
  service.DS_GLOBAL_CELLTOWER = -1;

  ;['dragend', 'zoom_changed'].forEach((event_name) => {
    $rootScope.$on('map_' + event_name, () => {
      if (!key) return

      var center = map.getCenter()
      if (!center) return
      var literal = { lat: center.lat(), lng: center.lng() }
      service.set('mapCenter', JSON.stringify(literal))
      service.set('mapZoom', map.getZoom())
    })
  })

  // Initialize the state of the application
  var initializeState = function () {

    service.planId = service.INVALID_PLAN_ID    // The plan ID that is currently selected
    service.GLOBAL_DATASOURCE_ID = 1

    // A list of location types to show in the locations layer
    service.locationTypes = []

    //location datasources for dropdown
    service.defaultDataSources = [
      {
        dataSourceId: service.DS_GLOBAL_BUSINESSES,
        name: "Global Businesses",
      },
      {
        dataSourceId: service.DS_GLOBAL_HOUSEHOLDS,
        name: "Global Households",
      },
      {
        dataSourceId: service.DS_GLOBAL_CELLTOWER,
        name: "Global CellTower",
      },

    ];

    // A list of location data sources to show in the locations layer
    service.locationDataSources = service.defaultDataSources

    // Optimization options
    service.optimizationOptions = {
      algorithm: 'UNCONSTRAINED',
      analysisSelectionMode: 'SELECTED_LOCATIONS',
      fiberNetworkConstraints: {
        routingMode: 'DIRECT_ROUTING',
      },
      processLayers: [],
      budget: 10000000,
      preIrrThreshold: 0.1,
      customOptimization: null,
      fiberSourceIds: [],
      networkTypes: null,
      threshold: null,
      routeGenerationOptions: [
        { id: 'T', value: 'A Route', checked: false },
        { id: 'A', value: 'B Route', checked: false },
        { id: 'B', value: 'C Route', checked: false },
        { id: 'C', value: 'D Route', checked: false }
      ],
      technologies: {
        fiber: false,
        fiveG: false
      }
    }

    // Iterate over the business segments in the configuration
    if (configuration && configuration.locationCategories && configuration.locationCategories.business && configuration.locationCategories.business.segments) {
      Object.keys(configuration.locationCategories.business.segments).forEach((key) => {
        var segment = configuration.locationCategories.business.segments[key];
        if (segment.show) {
          service.locationTypes.push({
            type: 'business',
            key: key,
            label: segment.label,
            checked: false,
            icon: configuration.locationCategories.mapIconFolder + 'businesses_' + key + '_default.png'
          })
        }
      })
    }

    // Show residential/household units
    if (configuration && configuration.locationCategories && configuration.locationCategories.household) {
      if (configuration.locationCategories.household.show) {
        service.locationTypes.push({
          type: 'household',
          key: 'household',
          label: configuration.locationCategories.household.label,
          checked: false,
          icon: configuration.locationCategories.mapIconFolder + 'households_default.png'
        })
      }
    }

    // Show Towers
    if (configuration && configuration.locationCategories && configuration.locationCategories.celltower) {
      if (configuration.locationCategories.celltower.show) {
        service.locationTypes.push({
          type: 'celltower',
          key: 'celltower',
          label: configuration.locationCategories.celltower.label,
          checked: false,
          icon: configuration.locationCategories.mapIconFolder + 'tower.png'
        })
      }
    }
  }
  initializeState()

  // When configuration is loaded from the server, update it in the state
  $rootScope.$on('configuration_loaded', () => {
    initializeState()
  })






  // Get a POST body that we will send to aro-service for performing optimization
  service.getOptimizationBody = () => {

    var optimizationBody = {}

    // Set location types
    optimizationBody.locationTypes = service.locationTypes.slice()

    // Set location data sources
    var locationDataSources = {}
    if (service.useGlobalBusiness) {
      locationDataSources.business = [1]
    }
    if (service.useGlobalHousehold) {
      locationDataSources.household = [1]
    }
    if (service.useGlobalCellTower) {
      locationDataSources.celltower = [1]
    }

    // Set uploaded location data sources
    var uploadedDataSourceIds = _.pluck(service.locationDataSources.useUploaded, 'dataSourceId')

    if (service.locationDataSources.useUploaded.length > 0) {
      var uploadedDataSourceIds = _.pluck(service.locationDataSources.useUploaded, 'dataSourceId');

      locationDataSources.business = locationDataSources.business || [];
      locationDataSources.business = locationDataSources.business.concat(uploadedDataSourceIds);

      locationDataSources.household = locationDataSources.household || [];
      locationDataSources.household = locationDataSources.household.concat(uploadedDataSourceIds);

      locationDataSources.celltower = locationDataSources.celltower || [];
      locationDataSources.celltower = locationDataSources.celltower.concat(uploadedDataSourceIds);
    }
    optimizationBody.locationDataSources = locationDataSources

    // Set algorithm
    optimizationBody.algorithm = service.optimizationOptions.algorithm
    if (service.optimizationOptions.algorithm === 'TABC') {
      var generations = service.optimizationOptions.routeGenerationOptions.filter((item) => item.checked)
      optimizationBody.customOptimization = {
        name: 'TABC',
        map: { generations: generations.join(',') }
      }
    }

    // Set regions/geometries for area planning
    var standardTypes = ['cma_boundaries', 'census_blocks', 'county_subdivisions', 'user_defined', 'wirecenter', 'cran', 'directional_facility']
    optimizationBody.geographies = regions.selectedRegions.map((i) => {
      var info = { name: i.name, id: i.id, type: i.type, layerId: i.layerId }
      // geography information may be too large so we avoid to send it for known region types
      if (standardTypes.indexOf(i.type) === -1) {
        info.geog = i.geog
      }
      if (i.layerId) {
        processingLayers.push(i.layerId)
      }
      return info
    })

    // Set budget
    optimizationBody.budget = service.optimizationOptions.budget
    optimizationBody.preIrrThreshold = service.optimizationOptions.preIrrThreshold
    optimizationBody.selectionMode = (optimization.getMode() === 'boundaries') ? 'SELECTED_AREAS' : 'SELECTED_LOCATIONS'
    optimizationBody.fiberNetworkConstraints = service.optimizationOptions.fiberNetworkConstraints

    if ()

    // TODO: USER DEFINED BOUNDARIES
    return optimizationBody

    // changes.networkTypes = [];
    // changes.networkTypes = $scope.selectedTechType;
    // if ($scope.selectedTechType.indexOf("FiveG") != -1) {
    //   if ($scope.cellNodeConstraints.cellRadius == "") {
    //     $scope.cellNodeConstraints.cellRadius = config.ui.map_tools.area_planning.cell_radius;
    //   }

    //   changes.fiberNetworkConstraints.cellNodeConstraints = {
    //     cellRadius: $scope.cellNodeConstraints.cellRadius,
    //     polygonStrategy: $scope.polygonOptions.polygonStrategy,
    //     tileSystemId: $scope.tileselected
    //   };
    // }

    // var selectLocationTypes = []
    // if ($scope.optimizationMode === 'targets' && $scope.optimizationType === 'IRR') {
    //   selectLocationTypes = Object.keys($scope.entityTypesTargeted)
    //     .map((key) => {
    //       return $scope.entityTypesTargeted[key]
    //         ? $scope.entityTypes.find((type) => type.id === key).name
    //         : null
    //     })
    //     .filter((val) => val)
    // }

    // if ($scope.selectedBoundary) {
    //   changes.processingLayers = [$scope.selectedBoundary.id]
    // }

    // $scope.selectLocationTypes = selectLocationTypes
    // changes.entityDataSources = optimization.datasources

    // var fiberSourceIds = optimization.getFiberSourceIds
    // changes.fiberSourceIds = fiberSourceIds()

  }






  service.clearPlan = (plan) => {
    key = null
    initializeState()
    localStorage.removeItem(`plan_${plan.id}`)
  }

  service.loadPlan = (plan) => {
    service.planId = +plan.id
    if (!plan) {
      key = null
      initializeState()
    } else {
      key = `plan_${plan.id}`
      try {
        state = JSON.parse(localStorage.getItem(key)) || {}
      } catch (err) {
        state = {}
      }
    }
  }

  service.set = (attr, value) => {
    if (state.planId === service.INVALID_PLAN_ID) return
    state[attr] = value
    localStorage.setItem(key, JSON.stringify(state))
  }

  service.get = (attr, value, def) => {
    if (state.planId === service.INVALID_PLAN_ID) return def
    return state[attr] || def
  }

  service.isDataSourceSelected = function (ds) {
      var existingDataSources = _.pluck(service.locationDataSources , 'dataSourceId');
      return existingDataSources.indexOf(ds) != -1;
  }

  return service
}])
