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
      $('#plan-saving-progress').show()
      $('#plan-saving .fa').show()
      if (!interval) {
        $('#plan-saving-progress .progress-bar').css('width', '0%').stop()
        $('#plan-saving .text').text('00:00 Runtime')
        interval = setInterval(() => {
          var diff = (Date.now() - time) / 1000
          var min = Math.floor(diff / 60)
          var sec = Math.ceil(diff % 60)
          $('#plan-saving .text').text(`${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec} Runtime`)
          var per = Math.min(99, Math.ceil(Math.log(diff * 5) * 10))
          $('#plan-saving-progress .progress-bar').css('width', per + '%')
        }, 200)
      }
    } else {
      $('#plan-saving').stop()
      $('#plan-saving .fa').hide()
      $('#plan-saving-progress .progress-bar').css('width', '100%')
      setTimeout(() => {
        $('#plan-saving-progress').hide()
        $('#plan-saving-progress .progress-bar').css('width', '0%').stop()
      }, 600)
      time = null
      clearInterval(interval)
      interval = null
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
