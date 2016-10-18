/* global app $ */
app.config(($httpProvider) => {
  var operations = 0

  function updateOperations (n) {
    operations += n
    if (operations > 0) {
      $('#plan-saved').stop().hide()
      $('#plan-saving').stop().show()
    } else {
      $('#plan-saving').stop().hide()
      $('#plan-saved').stop().show()
      setTimeout(() => {
        $('#plan-saved').fadeOut()
      }, 500)
    }
  }

  $httpProvider.interceptors.push(($q) => {
    return {
      request: (config) => {
        if (config.saving_plan) {
          updateOperations(1)
        }
        var deferred = $q.defer()
        deferred.resolve(config)
        return deferred.promise
      },
      response: (response) => {
        if (response.config.saving_plan) {
          updateOperations(-1)
        }
        return response
      },
      'requestError': (rejection) => {
        if (rejection.config.saving_plan) {
          updateOperations(-1)
        }
        return $q.reject(rejection)
      },

      'responseError': (rejection) => {
        if (rejection.config.saving_plan) {
          updateOperations(-1)
        }
        return $q.reject(rejection)
      }
    }
  })
})
