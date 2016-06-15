package com.altvil.aro.service.roic.analysis.model;

import com.altvil.aro.service.roic.StreamModel;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.AnalysisCode;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;


public interface ComponentModel {
	
	public enum EntityAnalysisType {
		household,
		business,
		tower,
		total
	}
	
	public EntityAnalysisType getAnalysisType() ;
	
	StreamModel getStreamModel() ;

	// Revenue By Network By LocationType  Count * Arpu
	// Premises Passed Locations connected By LocationType 
	// Subscribers By EntityType ( Penetration * Location )
	// Subscribers By EntityType ( Penetration )

	// CAPEX (2016)
	//*********** Network Deployment
	// Connect Crazy Formula By Year
	// Revenue * 4.23%
	
	AnalysisRow getAnalysisRow(CurveIdentifier id) ;
	
	
	
	ComponentModel add(ComponentModel other) ;
	ComponentModel minus(ComponentModel other) ;
	
	

}
