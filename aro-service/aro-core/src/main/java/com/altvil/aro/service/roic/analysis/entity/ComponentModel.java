package com.altvil.aro.service.roic.analysis.entity;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.AnalysisCode;


public interface ComponentModel {
	
	public enum EntityAnalysisType {
		household,
		business,
		tower,
		total
	}
	
	public EntityAnalysisType getAnalysisType() ;

	// Revenue By Network By LocationType  Count * Arpu
	// Premises Passed Locations connected By LocationType 
	// Subscribers By EntityType ( Penetration * Location )
	// Subscribers By EntityType ( Penetration )

	// CAPEX (2016)
	//*********** Network Deployment
	// Connect Crazy Formula By Year
	// Revenue * 4.23%
	
	AnalysisRow getAnalysisRow(AnalysisCode code) ;
	
	
	ComponentModel add(ComponentModel other) ;
	ComponentModel difference(ComponentModel other) ;
	
	

}
