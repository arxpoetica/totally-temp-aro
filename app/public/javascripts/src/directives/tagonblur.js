// Create a ui-select tag on blur
app.directive('tagOnBlur', function ($timeout) {
  return {
    require: 'uiSelect',
    link: function (scope, elm, attrs, ctrl) {
      scope.$on('uis:select', function (event, item) {
        ctrl.search = ''
      })
      ctrl.searchInput.on('blur', function (e) {
        if ((ctrl.items.length > 0 || ctrl.tagging.isActivated)) {
          $timeout(function () {
            ctrl.searchInput.triggerHandler('tagged')
            var newItem = ctrl.search
            if (ctrl.tagging.fct) {
              newItem = ctrl.tagging.fct(newItem)
            }
            if ((newItem) && (newItem != '')) { ctrl.select(newItem, true) }
            ctrl.search = ''
          })
        }
      })
    }
  }
})
