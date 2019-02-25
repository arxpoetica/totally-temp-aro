/* global app swal config _  $ */
app.service('optimization', ($rootScope, $http, $q) => {
  var optimization = {}

  var mode = null
  var interval
  var currentPlan = null
  optimization.setMode = (_mode) => {
    if (mode !== _mode) {
      mode = _mode
      $rootScope.$broadcast('optimization_mode_changed', mode)
    }
  }

  optimization.getMode = () => {
    return mode
  }

  $rootScope.$on('plan_selected', (e, plan) => {
    currentPlan = plan
    stopPolling()
    $('#plan-saving-progress').hide()
  })

  function stopPolling (success, text) {
    var wait = 0
    setTimeout(() => {
      $('#plan-saving').stop()
      $('#plan-saving .fa').hide()
      $('#plan-saving-progress .progress-bar')
        .css('width', '100%')
        .removeClass('progress-bar-striped')
        .removeClass('progress-bar-success')
        .removeClass('progress-bar-danger')
        .addClass(success ? 'progress-bar-success' : 'progress-bar-danger')
      if (success) {
        if (currentPlan) {
          $http.get('/network_plan/' + currentPlan.id).then((response) => {
            $rootScope.$broadcast('route_planning_changed', response.data)
          })
        }
      } else {
        $('#plan-saving-progress .progress-bar').text(text)
      }
      clearInterval(interval)
      interval = null
      $rootScope.$broadcast('optimization_stopped_polling')
      if (!$rootScope.$$phase) { $rootScope.$apply() }
    }, wait)
  }

  function startPolling (optimizationIdentifier) {
    clearInterval(interval)
    $('#plan-saved').stop().hide()
    $('#plan-saving').stop().show()
    $('#plan-saving-progress').show()
    $('#plan-saving .fa').show()
    $('#plan-saving-progress .progress-bar').css('width', '0%').stop().text('00:00 Runtime')
      .addClass('progress-bar-striped')
      .removeClass('progress-bar-success')
      .removeClass('progress-bar-danger')
    interval = setInterval(() => {
      $http.get('/optimization/processes/' + optimizationIdentifier).then((response) => {
        if (response.data.optimizationState === 'COMPLETED') return stopPolling(true)
        if (response.data.optimizationState === 'CANCELED') return stopPolling(false, 'Cancelled')
        if (response.data.optimizationState === 'FAILED') return stopPolling(false, 'Failed')
        var diff = (Date.now() - new Date(response.data.startDate).getTime()) / 1000
        var min = Math.floor(diff / 60)
        var sec = Math.ceil(diff % 60)
        var per = response.data.progress * 100
        $('#plan-saving-progress .progress-bar').css('width', per + '%').text(`${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec} Runtime`)
      })
    }, 400)
    $rootScope.$broadcast('optimization_started_polling')
  }

  optimization.optimize = (plan, changes, geographies, success, error) => {
    var canceler = $q.defer()

    // Clear the geography selection from the plan
    function clearGeographySelection (planId) {
      return $http.post('/network_plan/' + planId + '/clearGeographySelection')
    }

    // Add the geographies to the plan
    function addGeographiesToPlan (planId, geographies) {
      if (!geographies || geographies.length === 0) {
        // No geographies to select. For example, if this is called from target builder.
        return Promise.resolve()
      }

      var url = '/network_plan/' + planId + '/addGeographies'

      // Split geographies into batches so that our POST body does not become too big
      const MAX_GEOGRAPHIES_PER_REQUEST = 100
      var copyOfGeographies = geographies.slice()
      var addGeographiesPromises = []
      while (copyOfGeographies.length > 0) {
        var chunkOfGeographies = copyOfGeographies.splice(0, MAX_GEOGRAPHIES_PER_REQUEST)
        addGeographiesPromises.push($http.post(url, { geographies: chunkOfGeographies }))
      }

      // Return a promise that resolves when all geographies have been added
      return Promise.all(addGeographiesPromises)
    }

    // Delete the analysis for the plan so that the state won't be 'COMPLETED' (or FAILED, etc)
    function deletePlanAnalysis (planId) {
      return $http.delete(`/service/v1/plan/${planId}/analysis?user_id=${user_id}`) // user_id is a global variable :(
    }

    function callOptimizationEndpoint (planId) {
      var url = '/network_plan/' + planId + '/edit'
      var options = {
        url: url,
        method: 'post',
        data: changes,
        timeout: canceler.promise
      }
      return $http(options)
    }

    function run (hideProgressBar) {
      // First clear any geography selections
      clearGeographySelection(plan.id)
        .then(addGeographiesToPlan.bind(null, plan.id, geographies))
        .then(deletePlanAnalysis.bind(null, plan.id))
        .then(callOptimizationEndpoint.bind(null, plan.id))
        .then((response) => {
          if (response.status >= 200 && response.status <= 299) {
            if (plan) {
              if (!changes.lazy) plan.ranOptimization = true
              if (!hideProgressBar && !changes.lazy && currentPlan && plan.id === currentPlan.id) {
                startPolling(response.data.optimizationIdentifier)
              }
              if (currentPlan) {
                $rootScope.$broadcast('route_planning_changed', response.data)
              }
              geographies && geographies()
            }
          } else {
            error()
          }
        })
    }

    function checkNumberOfAreas () {
      if (changes.algorithm === 'TABC' && changes.geographies.length >= 15) {
        var timing = changes.geographies.length
        swal({
          title: '',
          text: `You are running a TABC analysis covering ${changes.geographies.length} service areas. While optimization is running, you will be sent back to the homescreen. Expected timing of optimization is ${timing} minutes.`,
          type: 'info',
          confirmButtonColor: '#b9b9b9',
          confirmButtonText: 'Run Optimization',
          cancelButtonText: 'Cancel',
          cancelButtonColor: '#DD6B55',
          showCancelButton: true,
          closeOnCancel: true,
          closeOnConfirm: true
        }, (confirmed) => {
          if (confirmed) {
            run(true)
            $rootScope.$broadcast('go-home')
            plan = null
          }
        })
      } else {
        swal.close()
        run()
      }
    }

    if (changes.lazy || !plan.ranOptimization || config.ui.map_tools.target_builder.eager) {
      checkNumberOfAreas()
    } else {
      swal({
        title: '',
        text: 'Would you like to replace the current optimization or create a new plan?',
        type: 'info',
        confirmButtonColor: '#b9b9b9',
        confirmButtonText: 'Create New Plan',
        cancelButtonText: 'Replace',
        cancelButtonColor: '#DD6B55',
        showCancelButton: true,
        closeOnCancel: false,
        closeOnConfirm: false
      }, (create) => {
        if (!create) return checkNumberOfAreas(plan)

        swal({
          title: 'New Plan name',
          type: 'input',
          showCancelButton: true,
          closeOnConfirm: true,
          inputPlaceholder: 'Plan Name'
        }, (name) => {
          if (!name) return error()

          var options = {
            url: '/network_plan/' + plan.id + '/copy',
            method: 'post',
            data: {
              name: name
            }
          }
          $http(options)
            .then((plan) => {
              if (plan.status >= 200 && plan.status <= 299) {
                $rootScope.$broadcast('plan_selected', plan.data)
                checkNumberOfAreas()
              } else {
                error()
              }
            })
        })
      })
    }

    return canceler
  }

  return optimization
})
