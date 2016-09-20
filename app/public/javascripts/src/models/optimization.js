/* global app swal */
app.service('optimization', ($rootScope, $http, $q) => {
  var optimization = {}

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
          plan.ran_optimization = true
          $rootScope.$broadcast('route_planning_changed', response)
          success && success()
        })
        .error(error)
    }

    if (!plan.ran_optimization) {
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
