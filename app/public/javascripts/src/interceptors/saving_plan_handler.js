/* global app $ */
app.config(($httpProvider) => {
  var operations = 0
  var time
  var interval

  function updateOperations (n) {
    operations += n
    if (operations > 0) {
      time = time || Date.now()
      $('#plan-saved').stop().hide()
      $('#plan-saving').stop().show()
      $('#plan-saving .fa').show()
      if (!interval) {
        $('#plan-saving .text').text('00:00 Runtime')
        interval = setInterval(() => {
          var diff = (Date.now() - time) / 1000
          var min = Math.floor(diff / 60)
          var sec = Math.ceil(diff % 60)
          $('#plan-saving .text').text(`${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec} Runtime`)
        }, 1000)
      }
    } else {
      $('#plan-saving').stop()
      $('#plan-saving .fa').hide()
      time = null
      clearInterval(interval)
      // $('#plan-saving').stop().hide()
      // $('#plan-saved').stop().show()
      // setTimeout(() => {
      //   $('#plan-saved').fadeOut()
      // }, 500)
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
