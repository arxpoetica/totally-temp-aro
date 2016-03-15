/* global app swal */
app.config(($httpProvider) => {
  function handleRejection (rejection) {
    var text = rejection.data && rejection.data.error
    if (!text) {
      text = rejection.status
        ? rejection.status + ' ' + rejection.statusText
        : 'The connection with the server failed'
    }
    swal({ title: 'Error!', text: text, type: 'error' })
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
