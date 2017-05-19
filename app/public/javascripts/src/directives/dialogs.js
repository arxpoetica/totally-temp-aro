/**
 * Created by saneesh on 19/5/17.
 */

app.directive("fiberStrandInfo" , function ($rootScope) {
    return {
        templateUrl : '/javascripts/src/directives/views/modal_fiber_segment_info.html',
        restrict: 'E',
        link :($scope , $element , $attrs)=>{

            $scope.fieldItems =[];
            $rootScope.$on("fiber_strand_selected" , (e , fiberInfo)=>{
                $scope.fieldItems.length = 0;
                generateSegmentDetails(fiberInfo);
            })


            function generateSegmentDetails(feature2) {
                //send details to fiber strand info
                $scope.fieldItems.push({
                    key : "ID",
                    value : feature2.getProperty("id")
                });
                $scope.fieldItems.push({
                    key : "Level",
                    value : feature2.getProperty("fiber_type")
                });
                $scope.fieldItems.push({
                    key : "Fiber Strands",
                    value : feature2.getProperty("fiber_strands")
                });
                $scope.fieldItems.push({
                    key : "Atomic Units Supported",
                    value : feature2.getProperty("atomic_units")
                });
                $scope.fieldItems.push({
                    key : "Entities Supported",
                    value : feature2.getProperty("raw_coverage")
                });
                $scope.fieldItems.push({
                    key : "Total Spend Supported",
                    value : feature2.getProperty("total_revenue")
                });
                $scope.fieldItems.push({
                    key : "Fair Share",
                    value : (feature2.getProperty("penetration") * 100).toFixed(1) + "%"
                });
                $scope.fieldItems.push({
                    key : "Fair Share Spend Supported",
                    value : feature2.getProperty("fairshare_demand").toFixed(1)
                });
                $scope.$apply();
            }

        }
    }
})