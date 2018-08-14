/* global app window */
app.service('tracker', ['$rootScope', ($rootScope) => {
  var tracker = {}

  tracker.CATEGORIES = Object.freeze({
    LOGIN: 'LOGIN',
    NEW_PLAN: 'NEW_PLAN',
    LOAD_PLAN: 'LOAD_PLAN',
    NEW_PLAN_TRANSACTION: 'NEW_PLAN_TRANSACTION',
    RESUME_PLAN_TRANSACTION: 'RESUME_PLAN_TRANSACTION',
    STEAL_PLAN_TRANSACTION: 'STEAL_PLAN_TRANSACTION',
    COMMIT_PLAN_TRANSACTION: 'COMMIT_PLAN_TRANSACTION',
    DISCARD_PLAN_TRANSACTION: 'DISCARD_PLAN_TRANSACTION',
    NEW_LOCATION_TRANSACTION: 'NEW_LOCATION_TRANSACTION',
    RESUME_LOCATION_TRANSACTION: 'RESUME_LOCATION_TRANSACTION',
    COMMIT_LOCATION_TRANSACTION: 'COMMIT_LOCATION_TRANSACTION',
    DISCARD_LOCATION_TRANSACTION: 'DISCARD_LOCATION_TRANSACTION'
  })

  tracker.ACTIONS = Object.freeze({
    CLICK: 'CLICK'
  })

  tracker.trackEvent = (category, action, label, value) => {
    try {
      // 'gtag' is a global variable defined in index.html if an analytics key is provided
      if (window.gtag) {
        gtag('event', category, {
          action: action,
          label: label,
          value: value
        })
      }
    } catch(err) {
      // Yes, we are swallowing the exception. But the tracker should never interfere with the functioning of the app. Being extra cautious.
      console.error(err)
    }
  }

  return tracker
}])
