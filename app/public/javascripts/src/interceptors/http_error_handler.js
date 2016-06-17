/* global app swal */
app.config(($httpProvider) => {
  function shouldHandleRejection (rejection) {
    if (rejection.config.timeout && rejection.config.timeout.canceled) return false
    if (rejection.config.customErrorHandling) return false
    return true
  }

  function handleRejection ($q, rejection) {
    if (shouldHandleRejection(rejection)) {
      var text = rejection.data && rejection.data.error
      if (!text) {
        text = rejection.status
          ? rejection.status + ' ' + rejection.statusText
          : 'The connection with the server failed'
      }
      swal({ title: 'Error!', text: text, type: 'error' })
    }
    return $q.reject(rejection)
  }

  $httpProvider.interceptors.push(($q) => {
    return {
      'requestError': (rejection) => handleRejection($q, rejection),
      'responseError': (rejection) => handleRejection($q, rejection)
    }
  })
})
