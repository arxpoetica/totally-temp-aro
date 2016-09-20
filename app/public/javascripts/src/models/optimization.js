/* global app */
app.service('optimization', ($rootScope, $http, $q, $location) => {
  var optimization = {}

  optimization.optimize = (plan, changes, success, error) => {
    var canceler = $q.defer()
    var url = '/network_plan/' + plan.id + '/edit'
    var options = {
      url: url,
      method: 'post',
      saving_plan: true,
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

      // $location.path('/coperoco')

    return canceler
  }

  return optimization
})
