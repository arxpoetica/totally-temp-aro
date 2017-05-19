/* global app config $ encodeURIComponent */
// Selected expert mode controller
app.controller('expert_mode_controller', ['$rootScope', '$scope', 'state', 'stateSerializationHelper', 'optimization', 'regions', ($rootScope, $scope, state, stateSerializationHelper, optimization, regions) => {
	
	$rootScope.isNetworkPlanning = false
	
	$rootScope.$on('show_expert_mode_modal', (e, args) => {
		$('#selected_expert_mode').modal('show')
    $('#expert_mode_body').val(JSON.stringify(state.getOptimizationBody(), undefined, 4))
		// Get geographies from state on init
		var selectedRegions = []
		Object.keys(regions.selectedRegions).forEach((key) => {
			var regionObj = regions.selectedRegions[key]
			selectedRegions.push({
				id: regionObj.id,
				name: regionObj.name,
				type: regionObj.type,
				layerId: regionObj.layerId
			})
		})
		$scope.geographies = JSON.stringify(selectedRegions, undefined, 2)
	})

	$scope.runexpertmode = () => {
		$rootScope.$broadcast('expert-mode-plan-edited', $('#expert_mode_body').val(), $scope.geographies, $rootScope.isNetworkPlanning);
	}
	
	$scope.refreshexpertmode = () => {
		$('#expert_mode_body').val("");  
	}
	
	$scope.saveExpertmode = () => {
		$rootScope.$broadcast('expert-mode-plan-save', $('#expert_mode_body').val(), $scope.geographies, $rootScope.isNetworkPlanning);
	}

}])
