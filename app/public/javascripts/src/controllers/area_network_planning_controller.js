/* global app swal $ config globalServiceLayers _ */
// Search Controller
app.controller('area-network-planning-controller', ['$scope', '$rootScope', '$http', '$q', 'map_tools', 'regions', 'optimization', 'state', 'map_layers', ($scope, $rootScope, $http, $q, map_tools, regions, optimization, state, map_layers) => {
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
  $scope.technologyTypes = [
      {id:'Fiber' , label : 'Fiber' , selected :true},
      {id:'FiveG' , label : '5G'}
  ]

  $scope.cellNodeConstraints = {
      cellGranularityRatio : 0,
      cellRadius: config.ui.map_tools.area_planning.cell_radius,
      polygonStrategy: 'FIXED_RADIUS'
  }
  $scope.coverageThreshold = config.ui.map_tools.area_planning.coverage_threshold;
  $scope.entityTypesTargeted = {}

  $scope.calculating = false

  $scope.optimizationType = 'CAPEX'
  $scope.irrThreshold = $scope.irrThresholdRange = 10
  $scope.budget = 10000000
  $scope.technology = 'direct_routing' // 'odn1'
  // Using polygonOptions as the HTML select is under a ng-repeat and will create a child scope that will not update
  $scope.polygonOptions = {
    polygonStrategy: 'FIXED_RADIUS'  // 'Fixed Radius'
  }

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
	$scope.selectedTechType.forEach(function(prevSelectedTechId) {
		$('#'+prevSelectedTechId).prop('checked', false)
	})
	$scope.selectedTechType = []	
	expertChanges.networkTypes.forEach(function(techId) {
		$scope.toggleTechType(techId,true)
		$('#'+techId).prop('checked', true)
		if (techId == 'FiveG') {
			$scope.cellNodeConstraints.cellRadius = expertChanges.fiberNetworkConstraints.cellNodeConstraints.cellRadius
			
			/* saving polygon type */
			$scope.polygonOptions.polygonStrategy = expertChanges.fiberNetworkConstraints.cellNodeConstraints.polygonStrategy.toUpperCase()
		}
	});
		
	/* saving network construction */
	switch (expertChanges.fiberNetworkConstraints.routingMode.toUpperCase()){
	   case "DIRECT_ROUTING" :  $scope.technology = "direct_routing";
	       break;
	   case "ODN_1": $scope.technology = "odn1";
	       break;
	   case "ODN_2": $scope.technology = "odn2";
	       break;
	}

	/* saving optimization type */
	if (expertChanges.algorithm === 'UNCONSTRAINED')
		$scope.optimizationType = 'CAPEX'
	else
		$scope.optimizationType = expertChanges.algorithm
			
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
		method: 'GET',
        params: params
    })
	.success((response) => {
		defer.resolve(response); 	  
	})
	return defer.promise; 
  }
  
  getTiles()
  
  function getTiles () {
	$http({
	 url: '/morphology/tiles',
	 method: 'GET'
	})
	.success((response) => {
	  $scope.tile_systems = response
	  $scope.tileselected = $scope.tile_systems[0].id;
	})
  }
  
  $scope.changeTileSelected = (tile_system_id) => {
	  $scope.tileselected = tile_system_id
  }
  
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

  $scope.prerun = () => {
	  
	var defer=$q.defer();
	  
    var locationTypes = []
    var scope = config.ui.eye_checkboxes ? $rootScope : $scope

    if ($scope.optimizationMode === 'targets' && $scope.optimizationType === 'IRR') {
      scope = $scope.entityTypesTargeted
    }

    var locationDataSources = state.locationDataSources;
    var locationStateTypes = state.locationTypes;


    if (locationDataSources.useGlobalHousehold) locationTypes.push('household')
    if (locationDataSources.useGlobalBusiness) {
      // locationTypes.push('businesses')
      locationTypes.push('large')
      locationTypes.push('medium')
    }

    locationStateTypes.forEach(function (locType) {
       if(locType.checked){
           locationTypes.push(locType.key);
       }
    });

    // if (scope.optimize2kplus) locationTypes.push('mrcgte2000')

    optimization.datasources = [];
    if(locationTypes.length > 0){
      optimization.datasources.push(1);
    }

    if(locationDataSources.useUploaded.length > 0){
      optimization.datasources.concat(locationDataSources.useUploaded)
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
            cellRadius : $scope.cellNodeConstraints.cellRadius,
            polygonStrategy: $scope.polygonOptions.polygonStrategy,
            tileSystemId: $scope.tileselected
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
    changes.entityDataSources = optimization.datasources
    
    var fiberSourceIds = optimization.getFiberSourceIds
    changes.fiberSourceIds = fiberSourceIds()
    
    defer.resolve(changes);
    return defer.promise;
    /*canceler = optimization.optimize($scope.plan, changes)*/
  }

  $scope.run = () => {
	  $scope.prerun().then(function(changes){
		  canceler = optimization.optimize($scope.plan, changes)
	  });
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
