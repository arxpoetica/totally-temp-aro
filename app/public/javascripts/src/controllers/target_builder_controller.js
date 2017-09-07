/* global app user_id google $ map FormData XMLHttpRequest swal config _ */
// Search Controller
app.controller('target-builder-controller', ['$scope', '$rootScope', '$http', '$q', 'map_tools', 'map_layers', '$timeout', '$window', 'optimization', 'state', ($scope, $rootScope, $http, $q, map_tools, map_layers, $timeout, $window, optimization, state) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.tools = Object.freeze({
    SINGLE: 1,
    POLYGON: 2
  })
  $scope.selectedTool = $scope.tools.SINGLE
  $scope.modes = {
    'single': null,
    'polygon': 'polygon'
  }
  $scope.user_id = user_id
  $scope.plan = null
  $scope.locationsHeatmap = false
  $scope.showHeatmapAlert = false
  $scope.targets = []
  $scope.targetsTotal = 0
  $scope.state = state

  // ARO version
  $scope.calculating = false

  $scope.optimizeHouseholds = true
  $scope.optimizeBusinesses = true
  $scope.optimizeSMB = true // special case
  $scope.optimizeTowers = true

  $scope.budget = 10000000
  // Using polygonOptions as the HTML select is under a ng-repeat and will create a child scope that will not update
  $scope.polygonOptions = {
    polygonStrategy: 'FIXED_RADIUS'  // 'Fixed Radius'
  }

  state.selectedLocations
    .subscribe((selectedLocations) => {
      // The selected locations have changed. Get the count and addresses that we want to show
      $scope.targetsTotal = selectedLocations.size
      var locationIds = Array.from(selectedLocations).slice(0, 9) // Only get addresses for a few locations
      $http.post('/network_plan/targets/addresses', { locationIds: locationIds })
        .then((result) => {
          if (result.status >= 200 && result.status <= 299) {
            $scope.targets = result.data
          }
        })
    })

  $scope.deleteAllTargets = () => {
    $http.delete(`/network_plan/${$scope.plan.id}/removeAllTargets`)
      .then((response) => {
        // Reload selected locations from database
        state.reloadSelectedLocations()
      })
  }

  $rootScope.$on('map_layer_clicked_feature', (event, options, map_layer) => {
    if (!map_tools.is_visible(map_tools.TOOL_IDS.TARGET_BUILDER)) {
      return  // Nothing to do if the target builder is not being shown
    }
    if (options) {
      // Get a list of ids to add and remove
      var existingIds = state.selectedLocations.getValue()
      var idsToAdd = new Set(), idsToRemove = new Set()
      options.forEach((option) => {
        if (existingIds.has(+option.location_id)) {
          idsToRemove.add(+option.location_id)
        } else {
          idsToAdd.add(+option.location_id)
        }
      })
      // Make these changes to the database, then reload targets from the DB
      var addRemoveTargetPromises = [
        $http.post(`/network_plan/${state.plan.id}/addTargets`, { locationIds: Array.from(idsToAdd) }),
        $http.post(`/network_plan/${state.plan.id}/removeTargets`, { locationIds: Array.from(idsToRemove) })
      ]
      Promise.all(addRemoveTargetPromises)
        .then((response) => {
          // Reload selected locations from database
          state.reloadSelectedLocations()
        })
    }
  })

  $rootScope.$on('map_tool_changed_visibility', (event, toolName) => {
    if (toolName === map_tools.TOOL_IDS.TARGET_BUILDER && map_tools.is_visible(toolName)) {
      state.optimizationOptions.uiAlgorithms = [
        state.OPTIMIZATION_TYPES.UNCONSTRAINED,
        state.OPTIMIZATION_TYPES.MAX_IRR,
        state.OPTIMIZATION_TYPES.BUDGET,
        state.OPTIMIZATION_TYPES.IRR_TARGET
      ]
      state.optimizationOptions.uiSelectedAlgorithm = state.optimizationOptions.uiAlgorithms[0]
      optimization.setMode('targets')
    }
  })

  var budgetInput = $('#target_builder_controller input[name=budget]')
  budgetInput.val($scope.budget.toLocaleString())

  const parseBudget = () => +(budgetInput.val() || '0').match(/\d+/g).join('') || 0

  budgetInput.on('focus', () => {
    budgetInput.val(String(parseBudget()))
  })

  budgetInput.on('blur', () => {
    budgetInput.val(parseBudget().toLocaleString())
  })
  
  $('.map-tool-wrapper').css('max-height', $window.innerHeight - 100)

  $scope.runExpertMode = () => {
    $rootScope.isNetworkPlanning = false
    $('#selected_expert_mode').modal('show')
    $('#expert_mode_body').val(JSON.stringify(state.getOptimizationBody(), undefined, 4))
  }
  $rootScope.$on('expert-mode-plan-edited', (e, optimizationBody, geographies, isNetworkPlanning) => {
    if(!isNetworkPlanning) {
      $scope.run(optimizationBody)
      $('#selected_expert_mode').modal('hide')
    }	
  })
  
  $rootScope.$on('expert-mode-plan-save', (e, expertModeChanges, geographies, isNetworkPlanning) => {
    if (!isNetworkPlanning) {
      state.loadOptimizationOptionsFromJSON(expertModeChanges)
      $('#selected_expert_mode').modal('hide')  
    }
  })

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
  
  $rootScope.$on('datasource_selected_location_modal', (e, selectedDatasource) => {
    if (selectedDatasource.length > 0) {
    	var dataSources = [];
	    dataSources = dataSources.concat(selectedDatasource)
	    var posSources = dataSources.map((id) => +id);
	    optimization.datasources = _.uniq(posSources);
    }
  })
  
  $scope.run = (optimizationBody) => {
    // Check if at least one data source is selected
    var isAnyDataSourceSelected = state.selectedDataSources.length > 0
	  // A location is selected if the "checked" property is true
    var isAnyLocationTypeSelected = (state.locationTypes.getValue().filter((item) => item.checked).length > 0) || (state.constructionSites.filter((item) => item.checked).length > 0)
    var validSelection = isAnyDataSourceSelected && isAnyLocationTypeSelected
    if (validSelection) {
      canceler = optimization.optimize($scope.plan, optimizationBody, [])
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
  
  $scope.setSelectedBoundary = () => {
	  var selectedProcessLayers = []
	  if ( $scope.selectedBoundary ) {
		  selectedProcessLayers.push($scope.selectedBoundary.id)  
	  }
	  state.optimizationOptions.processLayers = selectedProcessLayers
  }

  function changeSelectionForFeaturesMatching(dataSources) {
    var layer = map_layers.getFeatureLayer('locations')
    var changes = layer.createEmptyChanges()

    if(dataSources.length > 0) {	
      var config = {
        url: `/locations/visible/${$scope.plan.id}`,
        method: 'post',
        data: {
          uploaded_datasources: dataSources,
        }
      }
      $http(config)
        .then((response) => {
          response.data.feature_collection.features.forEach((feature) => {
            var prop = feature.properties

            var type = layer.changes || layer.type
            var id = prop.id
            if (changes.insertions[type].indexOf(id) === -1) {
                changes.insertions[type].push(id)
            }
            if (!$rootScope.$$phase) { $rootScope.$apply() }
          })
          layer.broadcastChanges(changes)
        })
     }
  }

  function planChanged (e, plan) {
    $scope.plan = plan
    if (!plan) return
  }
  $rootScope.$on('plan_selected', planChanged)

  $rootScope.$on('map_tool_changed_visibility', (e, tool) => {
    if (tool === 'target_builder') {
      drawingManager.setMap(map_tools.is_visible('target_builder') ? map : null)
    }
  })

  $scope.isToolSelected = (name) => {
    return $scope.selectedTool === name
  }

  $scope.setActiveTool = (id) => {
    $scope.selectedTool = id
    var drawingMode = (id === $scope.tools.POLYGON) ? 'polygon' : null
    drawingManager.setDrawingMode(drawingMode)
  }

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: false
  })

  $scope.deselectMode = false

  drawingManager.addListener('overlaycomplete', (e) => {
    var overlay = e.overlay
    state.requestPolygonSelect.next({
      coords: overlay.getPath().getArray()
    })
    if (e.type !== drawingManager.getDrawingMode()) {
      return overlay.setMap(null)
    }
    $rootScope.$broadcast('selection_tool_' + e.type, overlay, $scope.deselectMode)
    setTimeout(() => {
      overlay.setMap(null)
    }, 100)
  })

  $(document).ready(() => drawingManager.setMap(map))

  function updateSelectionTools (e) {
    $scope.deselectMode = e.shiftKey
    if (!$rootScope.$$phase) { $rootScope.$apply() } // refresh button state
  }

  document.addEventListener('keydown', updateSelectionTools)
  document.addEventListener('keyup', updateSelectionTools)

  $('#target-builder-upload input').change(() => {
    var form = $('#target-builder-upload').get(0)
    var formData = new FormData(form)
    var xhr = new XMLHttpRequest()
    xhr.open('POST', `/network/nodes/${$scope.plan.id}/csvIds`, true)
    xhr.addEventListener('error', (err) => {
      form.reset()
      console.log('error', err)
      swal('Error', err.message, 'error')
    })
    xhr.addEventListener('load', function (e) {
      form.reset()
      try {
        var data = JSON.parse(this.responseText)
      } catch (e) {
        console.log(e, e)
        return swal('Error', 'Unexpected response from server', 'error')
      }
      if (this.status !== 200) {
        return swal('Error', data.error || 'Unknown error', 'error')
      }
      swal('File processed', `Locations selected: ${data.found}, not found: ${data.notFound}, errors: ${data.errors}`, 'info')
      $scope.pendingPost = true
    })
    xhr.send(formData)
  })

  $scope.search_results = null

  var marker
  var search = $('#map-tools-target-builder .select2')

  function configureBusinessesSearch () {
    search.select2({
      ajax: {
        url: '/search/businesses',
        dataType: 'json',
        delay: 250,
        data: (term) => ({ text: term }),
        results: (data, params) => {
          var items = data.map((location) => {
            return {
              id: String(location.id),
              text: location.name,
              geog: location.centroid
            }
          })
          $scope.search_results = items

          return {
            results: items,
            pagination: {
              more: false
            }
          }
        },
        cache: true
      }
    })

    search.on('change', function (e) {
      var location = e.added
      if (!location) return
      var center = { lat: location.geog.coordinates[1], lng: location.geog.coordinates[0] }
      map.setCenter(center)
      if (marker) marker.setMap(null)

      marker = new google.maps.Marker({
        position: center,
        map: map,
        animation: google.maps.Animation.DROP
      })

      google.maps.event.addListener(marker, 'click', (event) => {
        $rootScope.$broadcast('open_location', location.id)
      })
    })

    $rootScope.$on('plan_selected', (e, plan) => {
      if (marker) marker.setMap(null)
      search.select2('val', '')
    })
  }

  $timeout(configureBusinessesSearch)
}])
