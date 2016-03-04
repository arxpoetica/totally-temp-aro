/* global $ app */
// Contextual Menu Controller
app.controller('contextual_menu_controller', ($scope, $rootScope, map_utils) => {
  var options = $scope.options = []
  var callbackParameters = null

  options.add = (label, callback) => {
    options.push({
      label: label,
      callback: callback
    })
  }

  function show_contextual_menu (gm_event, event_name) {
    var pixel = map_utils.fromLatLngToPoint(gm_event.latLng)
    options.splice(0, options.length)
    $rootScope.$broadcast.apply($rootScope, [event_name, options].concat(callbackParameters))
    $scope.$apply()
    if (options.length === 0) {
      $('#contextual_menu').css({
        display: 'none'
      })
      return
    }

    $('#contextual_menu').css({
      left: pixel.x + 'px',
      top: pixel.y + 'px',
      display: 'block'
    })
  }

  $rootScope.$on('map_rightclick', (e, event) => {
    callbackParameters = [event]
    show_contextual_menu(event, 'contextual_menu_map')
  })

  $rootScope.$on('map_layer_rightclicked_feature', (e, event, map_layer, feature) => {
    callbackParameters = [map_layer, event.feature]
    show_contextual_menu(event, 'contextual_menu_feature')
  })

  $rootScope.select_option = (index) => {
    var option = options[index]
    option && option.callback.apply(null, callbackParameters)
  }

  $('html').click(() => {
    $('#contextual_menu').css({
      display: 'none'
    })
  })
})
