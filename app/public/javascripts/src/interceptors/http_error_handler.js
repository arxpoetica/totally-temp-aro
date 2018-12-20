/* global app swal */
app.config(($httpProvider) => {

  // The keys for CUSTOM_ERRORS should map to aro-service enum AroError
  const CUSTOM_ERRORS = {
    INSUFFICIENT_PERMISSIONS_TO_MODIFY_PLAN: {
      title: 'Permissions error',
      text: 'You do not have the permission level required to edit this plan'
    },
    NO_SUBNET_FOUND: {
      title: 'Central Office error',
      text: 'Unable to find a Central Office that we can link this node to'
    }
  }

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
      // If we have a custom error for this error code, then show it. Else, show a generic message
      const customError = rejection.data.code && CUSTOM_ERRORS[rejection.data.code]
      if (customError) {
        swal({ title: customError.title, text: customError.text, type: 'error' })
      } else {
        if (rejection.status === 412) {
          console.error({ title: 'Error!', text: `ARO-Service returned status code ${rejection.status}`, type: 'error' })
        } else {
          swal({ title: 'Error!', text: `ARO-Service returned status code ${rejection.status}`, type: 'error' })
        }
      }
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
