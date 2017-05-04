/* global app swal $ config globalServiceLayers _ */
// Search Controller
app.controller('area-network-planning-controller', ['$scope', '$rootScope', '$http', '$q', 'map_tools', 'regions', 'optimization', 'state', 'map_layers', ($scope, $rootScope, $http, $q, map_tools, regions, optimization, state, map_layers) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.regions = regions
  $scope.ARO_CLIENT = config.ARO_CLIENT
  $scope.state = state

  $scope.removeGeography = (geography) => {
    regions.removeGeography(geography)
  }
  $scope.removeAllGeographies = () => {
    regions.removeAllGeographies()
  }

  $scope.calculating = false
  $scope.irrThresholdRange = state.optimizationOptions.preIrrThreshold
  $scope.optimizationTypeOptions = []
  
  $scope.runExpertMode = () => {
    $rootScope.isNetworkPlanning = true
    $('#selected_expert_mode').modal('show')
    $('#expert_mode_body').val(JSON.stringify(state.getOptimizationBody(), undefined, 4))
  }
  
  $rootScope.$on('expert-mode-plan-edited', (e, changes, isNetworkPlanning) => {
	  if (isNetworkPlanning) {
		  state.loadOptimizationOptionsFromJSON(changes)
		  canceler = optimization.optimize($scope.plan, state.getOptimizationBody())
		  $('#selected_expert_mode').modal('hide')
	  }	  
  })

  $rootScope.$on('expert-mode-plan-save', (e, expertModeChanges, isNetworkPlanning) => {
	  if (isNetworkPlanning) {
		  state.loadOptimizationOptionsFromJSON(expertModeChanges)
		  $('#selected_expert_mode').modal('hide')  
	  }
  })
  
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

  $scope.run = () => {
    // Check if at least one data source is selected
    var isAnyDataSourceSelected = state.selectedDataSources.length > 0
	  // A location is selected if the "checked" property is true
    var isAnyLocationTypeSelected = (state.locationTypes.filter((item) => item.checked).length > 0)
    var validSelection = isAnyDataSourceSelected && isAnyLocationTypeSelected
    if (validSelection) {
      canceler = optimization.optimize($scope.plan, state.getOptimizationBody())
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
