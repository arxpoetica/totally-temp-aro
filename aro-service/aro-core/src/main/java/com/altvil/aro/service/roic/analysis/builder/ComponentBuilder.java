package com.altvil.aro.service.roic.analysis.builder;

import com.altvil.aro.service.roic.penetration.NetworkPenetration;

public interface ComponentBuilder {

	// By Network By LocationType

	//// 40% fair share
	
	ComponentBuilder setNetworkPenetration(NetworkPenetration penetration);
	ComponentBuilder setNetworkPenetration(double start, double end,
			double rate);
	ComponentBuilder setArpu(double arpu);
	ComponentBuilder setOpEx(double percent);

	ComponentBuilder setEntityCount(double startCount) ;
	ComponentBuilder setEntityGrowth(double growth) ;
	ComponentBuilder setChurnRate(double churnRate) ;
	ComponentBuilder setChurnRateDecrease(double churnRateDecrease) ;
	
	NetworkAnalysisBuilder resolve();
	
	// BAU Copper (Opex)

	// Copper + FIber => Outputs -r of fiber .03

	// BAU Cash Flow By Year (Locations -> Type)

	// Plan Cash Flow

	// Delta (Plan - BAU)

	// Revenue By Network By LocationType
	// Premises Passed Locations connected By LocationType
	// Subscribers By EntityType ( Penetration * Location )
	// Subscribers By EntityType ( Penetration )

	// CAPEX (2016)
	// Network Deployment
	// Connect Crazy Formula By Year
	// Revenue * 4.23%

}
