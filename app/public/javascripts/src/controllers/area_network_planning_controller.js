/* global app swal $ config globalServiceLayers _ */
// Search Controller
app.controller('area-network-planning-controller', ['$scope', '$rootScope', '$http', '$q', 'map_tools', 'regions', 'optimization', 'state', 'map_layers', ($scope, $rootScope, $http, $q, map_tools, regions, optimization, state, map_layers) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.regions = regions
  $scope.ARO_CLIENT = config.ARO_CLIENT
  $scope.state = state

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
  $scope.cellNodeConstraints = {
      cellGranularityRatio : 0,
      cellRadius: config.ui.map_tools.area_planning.cell_radius,
      polygonStrategy: 'FIXED_RADIUS'
  }
  $scope.coverageThreshold = config.ui.map_tools.area_planning.coverage_threshold;
  $scope.entityTypesTargeted = {}

  $scope.calculating = false

  $scope.irrThresholdRange = state.optimizationOptions.preIrrThreshold
  $scope.budget = 10000000
  // Using polygonOptions as the HTML select is under a ng-repeat and will create a child scope that will not update
  $scope.polygonOptions = {
    polygonStrategy: 'FIXED_RADIUS'  // 'Fixed Radius'
  }

  $scope.optimizationTypeOptions = []
  
  $scope.runExpertMode = () => {
	  $scope.prerun().then(function(changes){
		  $rootScope.isNetworkPlanning = true
		  $('#selected_expert_mode').modal('show')
		  $('#expert_mode_body').val(JSON.stringify(changes, undefined, 4))
	  });
  }
  
  function saveExpertMode (expertModeChanges) {

	var expertChanges = JSON.parse(expertModeChanges)

    var locationStateTypes = state.locationTypes;
    locationStateTypes.map(function (locTypes) {
      locTypes.checked = expertChanges.locationTypes.indexOf(locTypes.key) != -1;
    });

    /* saving technology */
    // TODO: Fix this
	// $scope.selectedTechType.forEach(function(prevSelectedTechId) {
	// 	$('#'+prevSelectedTechId).prop('checked', false)
	// })
	// $scope.selectedTechType = []	
	// expertChanges.networkTypes.forEach(function(techId) {
	// 	$scope.toggleTechType(techId,true)
	// 	$('#'+techId).prop('checked', true)
	// 	if (techId == 'FiveG') {
	// 		$scope.cellNodeConstraints.cellRadius = expertChanges.fiberNetworkConstraints.cellNodeConstraints.cellRadius
			
	// 		/* saving polygon type */
	// 		$scope.polygonOptions.polygonStrategy = expertChanges.fiberNetworkConstraints.cellNodeConstraints.polygonStrategy.toUpperCase()
	// 	}
	// });
		
	/* saving network construction */
  $scope.state.optimizationOptions.fiberNetworkConstraints = expertChanges.fiberNetworkConstraints

	/* saving optimization type */
  $scope.state.optimizationOptions.algorithm = expertChanges.algorithm
			
	/* saving regions */		
	regions.removeAllGeographies()
	var expertSelectedWirecenters = []
	expertChanges.geographies.forEach((wirecenter) => {
		expertSelectedWirecenters.push(wirecenter.id)
	})
		
	$scope.fetchWirecentersInfo(expertSelectedWirecenters).then(function(wirecentersInfo){
		wirecentersInfo.map((boundary) => {
		    var n = boundary.id.indexOf(':')
		    var type = boundary.id.substring(0, n)
		    var id = boundary.id.substring(n + 1)

	           regions.selectGeography({
	               id: id,
	               name: boundary.name,
	               geog: boundary.geog,
	               type: type
	           })
	       })
	});
  }	  
  
  $rootScope.$on('expert-mode-plan-edited', (e, changes, isNetworkPlanning) => {
	  if (isNetworkPlanning) {
		  saveExpertMode(changes)
		  canceler = optimization.optimize($scope.plan, JSON.parse(changes))
		  $('#selected_expert_mode').modal('hide')
	  }	  
  })
  
  $rootScope.$on('expert-mode-plan-save', (e, expertModeChanges, isNetworkPlanning) => {
	  if (isNetworkPlanning) {
		  saveExpertMode(expertModeChanges)
		  $('#selected_expert_mode').modal('hide')  
	  }
  })
  
  $scope.fetchWirecentersInfo = (expertSelectedWirecenters) => { 
	var defer=$q.defer();	
	var params = {
		expertSelectedWirecenters: expertSelectedWirecenters
	}
	$http({
		url: '/boundary/info',
		method: 'POST',
        data: params
    })
	.success((response) => {
		defer.resolve(response); 	  
	})
	return defer.promise; 
  }
  
  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan

    if (plan) {
      $scope.reportName = plan.name
      $scope.state.optimizationOptions.algorithm = plan.optimization_type ? plan.optimization_type : 'UNCONSTRAINED'
    }

    $scope.entityTypes.forEach((entity) => {
      $scope.entityTypesTargeted[entity.id] = true
    })
  })

  $scope.routeGenerationOptionsChanged = (id) => {
    if ($scope.state.routeGenerationOptions[id]) {
      // check all above
      $scope.state.optimizationOptions.routeGenerationOptions.some((option) => {
        if (option.id === id) return true
        $scope.state.optimizationOptions.routeGenerationOptions[option.id].checked = true
        return false
      })
    } else {
      // uncheck all below
      $scope.state.optimizationOptions.routeGenerationOptions.slice(0).reverse().some((option) => {
        if (option.id === id) return true
        $scope.state.optimizationOptions.routeGenerationOptions[option.id].checked = false
        return false
      })
    }
  }

  $scope.irrThresholdRangeChanged = () => {
    $scope.state.optimizationOptions.preIrrThreshold = +$scope.irrThresholdRange
  }

  $scope.irrThresholdChanged = () => {
    $scope.irrThresholdRange = $scope.state.optimizationOptions.preIrrThreshold
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

  $scope.prerun = () => {
      console.log(state.getOptimizationBody())
	  
	var defer=$q.defer();
	  
    var scope = config.ui.eye_checkboxes ? $rootScope : $scope

    if ($scope.optimizationMode === 'targets' && $scope.state.optimizationOptions.algorithm === 'IRR') {
      scope = $scope.entityTypesTargeted
    }

    // Set location types
    var selectedLocationTypes = state.locationTypes.filter((item) => item.checked)  // Get all location types that are checked
    var locationTypes = _.pluck(selectedLocationTypes, 'key')   // Get the 'key' property of all checked location types

    // Set location data sources
    var locationDataSources = {}

    if (state.isDataSourceSelected(state.DS_GLOBAL_BUSINESSES)) {
      locationDataSources.business = [1]
    }
    if (state.isDataSourceSelected(state.DS_GLOBAL_HOUSEHOLDS)) {
      locationDataSources.household = [1]
    }
    if (state.isDataSourceSelected(state.DS_GLOBAL_CELLTOWER)) {
      locationDataSources.celltower = [1]
    }
    if (state.locationDataSources.length > 0) {
      var uploadedDataSourceIds = _.pluck(state.locationDataSources, 'dataSourceId')

      //remove default datasources from selected datasources..
      uploadedDataSourceIds = _.filter(uploadedDataSourceIds, function(d) { return d != -3 && d != -2 && d != -1});

      locationDataSources.business = locationDataSources.business || []
      locationDataSources.business = locationDataSources.business.concat(uploadedDataSourceIds)

      locationDataSources.household = locationDataSources.household || []
      locationDataSources.household = locationDataSources.household.concat(uploadedDataSourceIds)

      locationDataSources.celltower = locationDataSources.celltower || []
      locationDataSources.celltower = locationDataSources.celltower.concat(uploadedDataSourceIds)
    }

    var processingLayers = []
    var algorithm = $scope.state.optimizationOptions.algorithm
    var changes = {
      locationTypes: locationTypes,
      locationDataSources: locationDataSources,
      geographies: regions.selectedRegions.map((i) => {
        var info = { name: i.name, id: i.id, type: i.type, layerId: i.layerId }
        // geography information may be too large so we avoid to send it for known region types
        // if (standardTypes.indexOf(i.type) === -1) {
        //   info.geog = i.geog
        // }
        if(!i.id){
          info.geog = i.geog
        }
        if (i.layerId) {
          processingLayers.push(i.layerId)
        }
        return info
      }),
      algorithm: $scope.state.optimizationOptions.algorithm,
      budget: $scope.state.optimizationOptions.budget,
      irrThreshold: $scope.state.optimizationOptions.preIrrThreshold / 100,
      selectionMode: $scope.optimizationMode === 'boundaries' ? 'SELECTED_AREAS' : 'SELECTED_LOCATIONS'
    }
    if ($rootScope.selectedUserDefinedBoundary) {
      processingLayers.push($rootScope.selectedUserDefinedBoundary.id)
    }
    if (processingLayers.length > 0) {
      changes.processingLayers = _.uniq(processingLayers)
    }

    if (algorithm === 'UNCONSTRAINED') {
      changes.algorithm = algorithm
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
    }else if(algorithm === "COVERAGE"){
      delete changes.budget
      delete changes.irrThreshold
      changes.threshold = $scope.coverageThreshold / 100;
    }else if (algorithm === "IRR_THRESH") {
        delete  changes.budget;
        changes.preIrrThreshold = changes.irrThreshold;
        delete changes.irrThreshold;
    }

    changes.fiberNetworkConstraints={
      routingMode: $scope.state.optimizationOptions.fiberNetworkConstraints.routingMode
    }

    changes.networkTypes = [];
    changes.networkTypes = $scope.selectedTechType;
    if($scope.selectedTechType.indexOf("FiveG")!=-1){
        if($scope.cellNodeConstraints.cellRadius == ""){
            $scope.cellNodeConstraints.cellRadius = config.ui.map_tools.area_planning.cell_radius;
        }

        changes.fiberNetworkConstraints.cellNodeConstraints = {
            cellRadius : $scope.cellNodeConstraints.cellRadius,
            polygonStrategy: $scope.polygonOptions.polygonStrategy,
            tileSystemId: $scope.tileselected
        };
    }

    var selectLocationTypes = []
    if ($scope.optimizationMode === 'targets' && $scope.state.optimizationOptions.algorithm === 'IRR') {
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
    
    var fiberSourceIds = optimization.getFiberSourceIds
    changes.fiberSourceIds = fiberSourceIds()
    
    defer.resolve(changes);
    return defer.promise;
    /*canceler = optimization.optimize($scope.plan, changes)*/
  }

  $scope.run = () => {
    // Check if at least one data source is selected
    var isAnyDataSourceSelected = state.locationDataSources.length > 0
	  // A location is selected if the "checked" property is true
    var isAnyLocationTypeSelected = (state.locationTypes.filter((item) => item.checked).length > 0)
    var validSelection = isAnyDataSourceSelected && isAnyLocationTypeSelected
    if (validSelection) {
      $scope.prerun().then(function(changes){
        canceler = optimization.optimize($scope.plan, changes)
      })
    } else {
      swal({
        title: 'Incomplete input',
        text: 'Please select one or more locations and data sources before running optimization',
        type: 'error',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Ok',
        closeOnConfirm: true
      })
    }
  }

  $scope.optimizationMode = optimization.getMode()
  $rootScope.$on('optimization_mode_changed', optimizationModeChanged)

  function optimizationModeChanged (e, mode) {
    $scope.optimizationMode = mode
    $scope.state.optimizationOptions.algorithm = 'UNCONSTRAINED'
    if (mode === 'targets') {
      $scope.optimizationTypeOptions = [
        { id: 'UNCONSTRAINED', label: 'Full Coverage' },
        { id: 'IRR', label: 'Budget' }
      ]
    } else {
      $scope.optimizationTypeOptions = [
        { id: 'UNCONSTRAINED', label: 'Full Coverage' },
        { id: 'MAX_IRR', label: 'Maximum IRR' },
        { id: 'IRR', label: 'Budget' },
        { id: 'BUDGET_IRR', label: 'IRR Target' },
        { id: 'IRR_THRESH', label: 'IRR Threshold'}

    ]
      if (config.ARO_CLIENT === 'verizon') {
        $scope.optimizationTypeOptions.push({ id: 'TABC', label: 'ABCD analysis' })
      }
      // { id: 'TARGET_IRR', label: 'IRR Target' },
      // { id: 'BUDGET_IRR', label: 'Budget and IRR Floor' }
    }

    $scope.optimizationTypeOptions.push({ id: 'COVERAGE', label: 'Coverage Target' });
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


    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false
    });

    $scope.deselectMode = false

    drawingManager.addListener('overlaycomplete', (e) => {
        var overlay = e.overlay
        if (e.type !== drawingManager.getDrawingMode()) {
            return overlay.setMap(null)
        }
        $rootScope.$broadcast('selection_tool_' + e.type, overlay, $scope.deselectMode , true)
        setTimeout(() => {
            overlay.setMap(null)
        }, 100)
    })

    $(document).ready(() => drawingManager.setMap(map));

    function setDrawingManagerEnabled (enabled) {
        if (enabled) {
            drawingManager.setDrawingMode(drawingManager.oldDrawingMode || null)
        } else {
            drawingManager.setDrawingMode(null)
        }
    }

  $scope.toggleSelectedTool =(name)=>{

      var unselected;
      if ($scope.selectedTool != name) {
          $scope.selectedTool = name
          drawingManager.oldDrawingMode = name
          drawingManager.setDrawingMode('polygon')

          unselected = true;

      } else {
          $scope.selectedTool = null
          drawingManager.oldDrawingMode = null
          drawingManager.setDrawingMode(null)

          unselected = false;

      }

      map_layers.getFeatureLayer('locations').unselectable = unselected
      map_layers.getFeatureLayer('selected_locations').unselectable = unselected
  }

  $scope.isToolSelected = (name) => {
    return $scope.selectedTool === name
  }

  $rootScope.$on('map_layer_selected_items', (e, layer, features) => {
      features.forEach(function (feature) {
        regions.regionsSelected(feature , layer)
      })
  })

}])
