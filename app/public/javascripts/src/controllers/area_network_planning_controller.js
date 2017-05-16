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
  
  $scope.runExpertMode = () => {
    $rootScope.isNetworkPlanning = true
    $('#selected_expert_mode').modal('show')
    $('#expert_mode_body').val(JSON.stringify(state.getOptimizationBody(), undefined, 4))
  }
  
  $rootScope.$on('expert-mode-plan-edited', (e, optimizationBody, isNetworkPlanning) => {
	  if (isNetworkPlanning) {
      $scope.run(optimizationBody)
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
        .then((response) => {
          console.log('stopped')
        })
    })
  }

  $scope.run = (optimizationBody) => {
    // Check if at least one data source is selected
    var isAnyDataSourceSelected = state.selectedDataSources.length > 0
	  // A location is selected if the "checked" property is true
    var isAnyLocationTypeSelected = (state.locationTypes.filter((item) => item.checked).length > 0)
    var validSelection = isAnyDataSourceSelected && isAnyLocationTypeSelected
    if (validSelection) {
      canceler = optimization.optimize($scope.plan, optimizationBody)
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
    if (mode === 'targets') {
      state.optimizationOptions.uiAlgorithms = [
        { id: 'UNCONSTRAINED', algorithm: 'UNCONSTRAINED', label: 'Full Coverage' },
        { id: 'BUDGET', algorithm: 'IRR', label: 'Budget' }
      ]
    } else {
      state.optimizationOptions.uiAlgorithms = [
        { id: 'UNCONSTRAINED', algorithm: 'UNCONSTRAINED', label: 'Full Coverage' },
        { id: 'MAX_IRR', algorithm: 'IRR', label: 'Maximum IRR' },
        { id: 'BUDGET', algorithm: 'IRR', label: 'Budget' },
        { id: 'IRR_TARGET', algorithm: 'IRR', label: 'IRR Target' },
        { id: 'IRR_THRESH', algorithm: 'IRR', label: 'IRR Threshold' }
      ]
      if (config.ARO_CLIENT === 'verizon') {
        state.optimizationOptions.uiAlgorithms.push({ id: 'TABC', algorithm: 'CUSTOM', label: 'ABCD analysis' })
      }
    }
    state.optimizationOptions.uiAlgorithms.push({ id: 'COVERAGE', algorithm: 'COVERAGE', label: 'Coverage Target' })
    state.optimizationOptions.uiSelectedAlgorithm = state.optimizationOptions.uiAlgorithms[0]
  }
  optimizationModeChanged(null, optimization.getMode())

  // processing layer
  $scope.allBoundaries = []
  $scope.selectedBoundary = null

  function loadBoundaries () {
    $http.get('/boundary/all')
      .then((response) => {
        $scope.allBoundaries = response.data
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

  $rootScope.$on('optimization_stopped_polling', (e, layer, features) => {
      $scope.calculating = false;
  })

  $rootScope.$on('optimization_started_polling', (e, layer, features) => {
      $scope.calculating = true;
  })

}])
