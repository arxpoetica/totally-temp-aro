/* global app swal */
app.config(($httpProvider) => {
  function handleRejection (rejection) {
    swal({
      title: 'Error!',
      text: rejection.status
        ? rejection.status + ' ' + rejection.statusText
        : 'The connection with the server failed',
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
