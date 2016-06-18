package com.altvil.aro.service.roic.analysis.model.builder;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;



public interface ComponentBuilder {

	// By Network By LocationType

	//// 40% fair share
	
	ComponentBuilder setComponentType(ComponentType type) ;
	ComponentBuilder setAnalysisPeriod(AnalysisPeriod period) ;
	
	
	ComponentBuilder setRoicModelInputs(ComponentInput inputs) ;
	
	RoicComponent build();
	
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
