/**
 * Directive to show a model value as a percentage.
 * For example, a model value of 0.1 will correspond to a value of 10 (and vice versa)
 */
app.directive('percentageInput', function () {
  return {
    require: 'ngModel',
    link: function (scope, elem, attrs, ngModel) {
      ngModel.$parsers.push(function toModel (input) {
        // Divide the value by 100 to store it in the model
        input = input || '0'
        return (+input) / 100.0
      })

      ngModel.$formatters.push(function toView (input) {
        // Multiply the value by 100 to display it in the view
        input = input || '0'
        var inputTransformed = (+input) * 100.0

        // toFixed() converts it to a string, and + converts it back to a number before returning
        return +inputTransformed.toFixed(2)
      })
    }
  }
})

/**
 * Directive to show a value formated by commas.
 * For example, a value of 10000 will correspond to a value of 10,000
 */
app.directive('format', ['$filter', function ($filter) {
  return {
    require: '?ngModel',
    link: function (scope, elem, attrs, ctrl) {
      if (!ctrl) return

      ctrl.$formatters.unshift(function (a) {
        return $filter(attrs.format)(ctrl.$modelValue)
      })

      ctrl.$parsers.unshift(function (viewValue) {
        var plainNumber = viewValue.replace(/[^\d|\-+|\.+]/g, '')
        elem.val($filter(attrs.format)(+plainNumber))
        return plainNumber
      })
    }
  }
}])
