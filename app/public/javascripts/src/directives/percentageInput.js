/**
 * Directive to show a model value as a percentage.
 * For example, a model value of 0.1 will correspond to a value of 10 (and vice versa)
 */
'use strict'

app.directive('percentageInput', function () {
  return {
    require: 'ngModel',
    link: function (scope, elem, attrs, ngModel) {
      ngModel.$parsers.push(function toModel(input) {
        // Divide the value by 100 to store it in the model
        input = input || '0'
        return (+input) / 100.0
      })

      ngModel.$formatters.push(function toView(input) {
        // Multiply the value by 100 to display it in the view
        console.log(typeof input)
        input = input || '0'
        var inputTransformed = (+input) * 100.0
        return inputTransformed.toFixed(2)
      })
    }
  }
})