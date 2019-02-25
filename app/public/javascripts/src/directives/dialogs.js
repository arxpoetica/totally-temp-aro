/**
 * Created by saneesh on 19/5/17.
 */

app.directive('fiberStrandInfo', function ($rootScope, $timeout, $filter) {
  return {
    templateUrl: '/javascripts/src/directives/views/modal_fiber_segment_info.html',
    restrict: 'E',
    link: ($scope, $element, $attrs) => {
      $scope.fieldItems = []
      $rootScope.$on('fiber_strand_selected', (e, fiberInfo) => {
        $scope.fieldItems.length = 0
        generateSegmentDetails(fiberInfo)
        $($element).find('.panel-fiber-details').draggable()
      })

      function generateSegmentDetails (feature2) {
        // send details to fiber strand info
        $scope.fieldItems.push({
          key: 'ID',
          value: feature2.getProperty('id')
        })
        $scope.fieldItems.push({
          key: 'Level',
          value: feature2.getProperty('fiber_type').charAt(0).toUpperCase() + feature2.getProperty('fiber_type').substring(1).toLowerCase()
        })
        $scope.fieldItems.push({
          key: 'Fiber Strands',
          value: $filter('number')(feature2.getProperty('fiber_strands'), 0)
        })
        $scope.fieldItems.push({
          key: 'Atomic Units Downstream',
          value: $filter('number')(feature2.getProperty('atomic_units'), 0)
        })
        $scope.fieldItems.push({
          key: 'Entities Downstream',
          value: $filter('number')(feature2.getProperty('raw_coverage'), 0)
        })
        $scope.fieldItems.push({
          key: 'Total Spend Downstream',
          value: $filter('currency')(feature2.getProperty('total_revenue') / 1000, config.currency_symbol, 0) + 'K'
        })
        $scope.fieldItems.push({
          key: 'Fair Share',
          value: (feature2.getProperty('penetration') * 100).toFixed(1) + '%'
        })
        $scope.fieldItems.push({
          key: 'Fair Share Spend',
          value: $filter('currency')(feature2.getProperty('monthly_revenue') / 1000, config.currency_symbol, 0) + 'K'
        })
        $scope.$apply()
      }

      $scope.panelClose = function () {
        $rootScope.$broadcast('fiber_segment_dialog_closed')
        $scope.fieldItems.length = 0
      }
    }
  }
})
