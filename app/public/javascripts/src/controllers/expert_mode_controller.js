/* global app config $ encodeURIComponent */
// Selected expert mode controller
app.controller('expert_mode_controller', ($rootScope, $scope, $http, map_layers, tracker, map_tools) => {
	
	$scope.runexpertmode = () => {
		
		$rootScope.$broadcast('expert-mode-plan-edited',$('#expert_mode_body').val());  
	}
	
	$scope.refreshexpertmode = () => {
		
		$('#expert_mode_body').val("");  
	}
	
	$scope.saveExpertmode = () => {
		
		$rootScope.$broadcast('expert-mode-plan-save',$('#expert_mode_body').val());  
	}

})
