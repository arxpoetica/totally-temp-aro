app.config(function($httpProvider) {

  var operations = 0;

  function update_operations(n) {
    operations += n;
    if (operations > 0) {
      $('#plan-saved').stop().hide();
      $('#plan-saving').stop().show();
    } else {
      $('#plan-saving').stop().hide();
      $('#plan-saved').stop().show();
      setTimeout(function() {
        $('#plan-saved').fadeOut();
      }, 500)
    }
  }

  $httpProvider.interceptors.push(function($q) {
    return {
      request: function(config) {
        if (config.saving_plan) {
          update_operations(1);
        }
        var deferred = $q.defer();
        deferred.resolve(config);
        return deferred.promise;
      },
      response: function(response) {
        if (response.config.saving_plan) {
          update_operations(-1);
        }
        return response;
      },
     'requestError': function(rejection) {
        if (rejection.config.saving_plan) {
          update_operations(-1);
        }
        return $q.reject(rejection);
      },

      'responseError': function(rejection) {
        if (rejection.config.saving_plan) {
          update_operations(-1);
        }
        return $q.reject(rejection);
      }
    };
  });
});
