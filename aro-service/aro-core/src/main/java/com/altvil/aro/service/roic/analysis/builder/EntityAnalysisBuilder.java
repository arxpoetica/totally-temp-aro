package com.altvil.aro.service.roic.analysis.builder;

import java.util.Map;

import com.altvil.aro.service.roic.analysis.impl.HouseHoldsConnectedPercent;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;

public interface EntityAnalysisBuilder {

	// By Network By LocationType

	//// 40% fair share
	
	EntityAnalysisBuilder setNetworkPenetration(NetworkPenetration penetration);

	EntityAnalysisBuilder setNetworkPenetration(double start, double end,
			double rate);

	EntityAnalysisBuilder setArpu(double arpu);

	EntityAnalysisBuilder setArpu(double[] arpuByYear);

	EntityAnalysisBuilder setArpu(Map<Integer, Double> arpu);

	EntityAnalysisBuilder setHouseHolds(double houseHolds, double growthRate);

	EntityAnalysisBuilder setOpEx(double percent);

	EntityAnalysisBuilder setConnecetCapex(
			HouseHoldsConnectedPercent.Coefficents coefficents);
	
	EntityAnalysisBuilder setConnecetCapex(
			double time, double penetration, double hhGrwoth, double churnRate, double churnDecrease);

	EntityAnalysisBuilder setConnectionCostCapex(double connectionCost); // 250

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
