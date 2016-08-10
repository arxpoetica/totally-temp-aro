package com.altvil.aro.service.cu.key;


public interface AroKeyService {
	
	AroKey createDeploymentKey(int serviceAreaId, long deploymentPlanId) ;
	AroKey createServiceAreaKey(int serviceAreaId) ;

}
