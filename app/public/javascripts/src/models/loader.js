app.service('loader', function($timeout) {

  $timeout(function() {
    $('#loader-wrapper').css('display', 'none');
  });

});
