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
    $rootScope.$broadcast('show_expert_mode_modal')
  }
  
  $rootScope.$on('expert-mode-plan-edited', (e, expertModeChanges, geographiesJSON, isNetworkPlanning) => {
	  if (isNetworkPlanning) {
      $scope.run(JSON.parse(expertModeChanges), JSON.parse(geographiesJSON))
      $('#selected_expert_mode').modal('hide')
	  }	  
  })

  $rootScope.$on('expert-mode-plan-save', (e, expertModeChanges, geographiesJSON, isNetworkPlanning) => {
	  if (isNetworkPlanning) {
      var optimizationOptions = JSON.parse(expertModeChanges)
      optimizationOptions.geographies = JSON.parse(geographiesJSON)
      state.loadOptimizationOptionsFromJSON(JSON.stringify(optimizationOptions))
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

  $scope.getSelectedGeographies = () => {
		var selectedRegions = []
		Object.keys(regions.selectedRegions).forEach((key) => {
			var regionObj = regions.selectedRegions[key]
			selectedRegions.push({
				id: regionObj.id,
				name: regionObj.name,
				type: regionObj.type,
				layerId: regionObj.layerId
			})
		})
    return selectedRegions
  }

  $scope.run = (optimizationBody, geographies) => {
    // Check if at least one data source is selected
    var isAnyDataSourceSelected = state.selectedDataSources.length > 0
	  // A location is selected if the "checked" property is true
    var isAnyLocationTypeSelected = (state.locationTypes.filter((item) => item.checked).length > 0)
    var validSelection = isAnyDataSourceSelected && isAnyLocationTypeSelected
    if (validSelection) {
      canceler = optimization.optimize($scope.plan, optimizationBody, geographies)
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

  $rootScope.$on('map_tool_changed_visibility', (event, toolName) => {
    if (toolName === map_tools.TOOL_IDS.AREA_NETWORK_PLANNING && map_tools.is_visible(toolName)) {
      state.optimizationOptions.uiAlgorithms = [
        state.OPTIMIZATION_TYPES.UNCONSTRAINED,
        state.OPTIMIZATION_TYPES.MAX_IRR,
        state.OPTIMIZATION_TYPES.BUDGET,
        state.OPTIMIZATION_TYPES.IRR_TARGET,
        state.OPTIMIZATION_TYPES.IRR_THRESH,
        state.OPTIMIZATION_TYPES.COVERAGE
      ]
      if (config.ARO_CLIENT === 'verizon') {
        state.optimizationOptions.uiAlgorithms.push(state.OPTIMIZATION_TYPES.TABC)
      }
      state.optimizationOptions.uiSelectedAlgorithm = state.optimizationOptions.uiAlgorithms[0]
    }
  })

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

  // Selects all the service areas that contain locations in the uploaded data sources
  $scope.isSelectingServiceAreas = false
  $scope.selectServiceAreasContainingDataSources = () => {

    // This feature is valid only if we have [1] no global data sources selected and [2] at least one uploaded data source selected
    var hasGlobalSources = state.isDataSourceSelected(state.DS_GLOBAL_BUSINESSES)
                           || state.isDataSourceSelected(state.DS_GLOBAL_HOUSEHOLDS)
                           || state.isDataSourceSelected(state.DS_GLOBAL_CELLTOWER)
    if (hasGlobalSources) {
      swal({
        title: 'Data source error',
        text: 'You cannot have a global data source selected in the locations layer when using this feature',
        type: 'error',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Ok',
        closeOnConfirm: true
      })
    } else if (state.selectedDataSources.length === 0) {
      swal({
        title: 'Data source error',
        text: 'Select at least one uploaded data source from the locations layer to use this feature',
        type: 'error',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Ok',
        closeOnConfirm: true
      })
    } else {
      // We now have at least one uploaded data source selected in the locations layer
      $scope.isSelectingServiceAreas = true
      var dataSources = _.pluck(state.selectedDataSources, 'dataSourceId')
      regions.removeAllGeographies()
      var url = '/boundary/serviceAreasContainingDataSources'
      $http.post(url, { dataSources: dataSources })
        .then((response) => {
          if (response.status >= 200 && response.status <= 299) {
            var serviceAreaIds = []
            response.data.forEach((item) => serviceAreaIds.push(item.id))
            regions.selectGeographyFromIds(serviceAreaIds)
              .finally(() => $scope.isSelectingServiceAreas = false)
          } else {
            $scope.isSelectingServiceAreas = false
          }
        })
    }
  }

}])
