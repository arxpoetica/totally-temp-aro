app.service('tracker', ['$rootScope', function($rootScope) {

  var tracker = {};

  if (typeof mixpanel !== 'undefined') {
    tracker.track = function(event_name, props) {
      if (typeof mixpanel !== 'undefined') {
        mixpanel.track(event_name, props);
      }
    };
  } else {
    tracker.track = function(event_name, props) {
      // console.log('track event', event_name, props);
    };
  }

  return tracker;

}]);
