/* global app swal config */
app.service('optimization', ($rootScope, $http, $q) => {
  var optimization = {}

  var mode = null
  optimization.setMode = (_mode) => {
    if (mode !== _mode) {
      mode = _mode
      $rootScope.$broadcast('optimization_mode_changed', mode)
    }
  }

  optimization.getMode = () => {
    return mode
  }

  optimization.optimize = (plan, changes, success, error) => {
    var canceler = $q.defer()

    function run (plan) {
      var url = '/network_plan/' + plan.id + '/edit'
      var options = {
        url: url,
        method: 'post',
        saving_plan: !changes.lazy,
        data: changes,
        timeout: canceler.promise
      }
      $http(options)
        .success((response) => {
          if (!changes.lazy) plan.ranOptimization = true
          $rootScope.$broadcast('route_planning_changed', response)
          success && success()
        })
        .error(error)
    }

    if (changes.lazy || !plan.ranOptimization || config.ui.map_tools.target_builder.eager) {
      run(plan)
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
        closeOnCancel: true,
        closeOnConfirm: false
      }, (create) => {
        if (!create) return run(plan)

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
              run(plan)
            })
            .error(error)
        })
      })
    }

    return canceler
  }

  return optimization
})
