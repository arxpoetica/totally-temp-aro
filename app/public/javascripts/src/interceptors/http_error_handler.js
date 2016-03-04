/* global app swal */
app.config(($httpProvider) => {
  function handleRejection (rejection) {
    swal({
      title: 'Error!',
      text: rejection.status + ' ' + rejection.statusText,
      type: 'error'
    })
  }

  $httpProvider.interceptors.push(($q) => {
    return {
      'requestError': (rejection) => {
        if (!rejection.config.customErrorHandling) {
          handleRejection(rejection)
        }
        return $q.reject(rejection)
      },

      'responseError': (rejection) => {
        if (!rejection.config.customErrorHandling) {
          handleRejection(rejection)
        }
        return $q.reject(rejection)
      }
    }
  })
})
