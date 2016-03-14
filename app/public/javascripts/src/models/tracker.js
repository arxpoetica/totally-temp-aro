/* global app window */
app.service('tracker', ['$rootScope', ($rootScope) => {
  var tracker = {}

  if (typeof mixpanel !== 'undefined') {
    tracker.track = (event_name, props) => {
      if (typeof mixpanel !== 'undefined') {
        window.mixpanel.track(event_name, props)
      }
    }
  } else {
    tracker.track = (event_name, props) => {
      // console.log('track event', event_name, props);
    }
  }

  return tracker
}])
