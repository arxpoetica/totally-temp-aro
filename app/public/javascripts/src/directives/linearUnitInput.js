/**
 * Directive to show and update a linear model value (e.g. 1000 meters) in user units (e.g. 3280.84 ft).
 * For example, a model value of 0.1 will correspond to a value of 10 (and vice versa)
 */
app.directive('linearUnitInput', ['state', function (state) {
  return {
    require: 'ngModel',
    link: function (scope, elem, attrs, ngModel) {
      ngModel.$parsers.push(function toModel (input) {
        // Convert user-input value (in user units) to meters
        input = input || '0'
        return (+input) * state.configuration.units.length_units_to_meters
      })

      ngModel.$formatters.push(function toView (input) {
        // Convert model value (always in meters) to user units before displaying it to the user
        input = input || '0'
        var inputTransformed = (+input) * state.configuration.units.meters_to_length_units

        // toFixed() converts it to a string, and + converts it back to a number before returning
        return +inputTransformed.toFixed(2)
      })
    }
  }
}])
