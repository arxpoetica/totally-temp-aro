package com.altvil.aro.service.optimization.wirecenter;

import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.optimization.wirecenter.generated.GeneratedData;
import com.altvil.aro.service.plan.CompositeNetworkModel;

public interface PlannedNetwork {

	long getPlanId() ;
	
	CompetitiveDemandMapping getCompetitiveDemandMapping() ;
	
	CompositeNetworkModel getPlannedNetwork() ;
	
	GeneratedData getGeneratedData() ;
	
	
}
