app.config(function($httpProvider) {

  function handleRejection(rejection) {
    swal({
      title: "Error!",
      text: rejection.status+' '+rejection.statusText,
      type: "error"
    });
  }

  $httpProvider.interceptors.push(function($q) {
    return {
     'requestError': function(rejection) {
        handleRejection(rejection);
        return $q.reject(rejection);
      },

      'responseError': function(rejection) {
        handleRejection(rejection);
        return $q.reject(rejection);
      }
    };
  });
});
