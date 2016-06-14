package com.altvil.aro.service.roic.analysis;

import java.util.Collection;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;
import com.altvil.aro.service.roic.product.ProductSet;


public interface AnalysisBuilder {

	AnalysisBuilder setAnalysisPeriod(int periodInMonths) ;
	AnalysisBuilder setProductSets(Collection<ProductSet> productSets) ;
	
	//By Network By LocationType
	AnalysisBuilder addNetworkPenetration(NetworkPenetration penetration) ;
	AnalysisBuilder setArpu(double[] arpuByYear) ;
	AnalysisBuilder setHouseHolds(double houseHolds, double growthRate) ;
	AnalysisBuilder setOpEx(double percent) ;
	AnalysisBuilder setConnectCapex(Object crazyFormula) ;
	AnalysisBuilder setConnectionCostCapex(double connectionCost) ; //250
	
	//40% fair share
	
	// BAU Copper	(Opex)
	
	// Copper + FIber => Outputs  -r of fiber .03
	
	//BAU Cash Flow By Year (Locations -> Type)
	//Plan Cash Flow
	//Delta (Plan - BAU)
	
	//Revenue By Network By LocationType
	//Premises Passed Locations connected By LocationType
	//Subscribers By EntityType ( Penetration * Location )
	//Subscribers By EntityType ( Penetration )
	
	//CAPEX (2016)
	//  Network Deployment 
	//  Connect Crazy Formula By Year
	//  Revenue * 4.23% 
	
}
