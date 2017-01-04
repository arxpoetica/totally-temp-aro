/* global app swal config _  $ */
app.service('optimization', ($rootScope, $http, $q) => {
  var optimization = {}

  var mode = null
  var fiberSourceIds = []
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

  optimization.setFiberSourceIds = (ids) => {
    fiberSourceIds = ids || []
  }

  $rootScope.$on('plan_selected', (e, plan) => {
    currentPlan = plan
    stopPolling()
  })

  function stopPolling () {
    var wait = 0
    setTimeout(() => {
      $('#plan-saving').stop()
      $('#plan-saving .fa').hide()
      $('#plan-saving-progress .progress-bar')
        .css('width', '100%')
        .removeClass('progress-bar-striped')
        .addClass('progress-bar-success')
      clearInterval(interval)
      interval = null
    }, wait)
  }

  function startPolling (planId) {
    clearInterval(interval)
    $('#plan-saved').stop().hide()
    $('#plan-saving').stop().show()
    $('#plan-saving-progress').show()
    $('#plan-saving .fa').show()
    $('#plan-saving-progress .progress-bar').css('width', '0%').stop().text('00:00 Runtime')
      .addClass('progress-bar-striped')
      .removeClass('progress-bar-success')
    interval = setInterval(() => {
      $http.get('/optimization/running/' + planId).success((response) => {
        var info = response[0]
        if (info) {
          var diff = (Date.now() - new Date(info.startDate).getTime()) / 1000
          var min = Math.floor(diff / 60)
          var sec = Math.ceil(diff % 60)
          var per = info.progress * 100
          $('#plan-saving-progress .progress-bar').css('width', per + '%').text(`${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec} Runtime`)
        } else {
          stopPolling()
        }
      })
    }, 400)
  }

  optimization.optimize = (plan, changes, success, error) => {
    var canceler = $q.defer()

    changes.entityDataSources = optimization.datasources
    if (changes.entityDataSources.length > 0) {
      changes.locationTypes = _.uniq((changes.locationTypes || []).concat(['celltower']))
    }

    changes.fiberSourceIds = fiberSourceIds

    function run (hideProgressBar) {
      var url = '/network_plan/' + plan.id + '/edit'
      var options = {
        url: url,
        method: 'post',
        // saving_plan: !hideProgressBar && !changes.lazy,
        data: changes,
        timeout: canceler.promise
      }
      $http(options)
        .success((response) => {
          if (plan) {
            if (!changes.lazy) plan.ranOptimization = true
            if (!hideProgressBar && !changes.lazy && currentPlan && plan.id === currentPlan.id) {
              startPolling(plan.id)
            }
            if (currentPlan) {
              $rootScope.$broadcast('route_planning_changed', response)
            }
            success && success()
          }
        })
        .error(error)
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
            .success((plan) => {
              $rootScope.$broadcast('plan_selected', plan)
              checkNumberOfAreas()
            })
            .error(error)
        })
      })
    }

    return canceler
  }

  return optimization
})
