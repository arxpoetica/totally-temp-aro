package com.altvil.aro.service.roic.analysis.model;

import java.util.Collection;
import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.calc.StreamModel;
import com.altvil.aro.service.roic.analysis.model.curve.AnalysisRow;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public interface RoicComponent extends RoicAnalysis {
	
	public enum ComponentType {
		undefined(null),
		smallBusiness(LocationEntityType.small),
		mediumBusiness(LocationEntityType.medium),
		largeBusiness(LocationEntityType.large),
		household(LocationEntityType.household),
		cellTower(LocationEntityType.celltower),
		network(null),
		
		;
		
		LocationEntityType locationEntityType ;

		private ComponentType(LocationEntityType locationEntityType) {
			this.locationEntityType = locationEntityType;
		}
		
		
		
	}
	
	Collection<CurveIdentifier> getCurveIdentifiers() ;

	AnalysisPeriod getAnalysisPeriod() ;
	ComponentType getComponentType() ;
	AnalysisRow getAnalysisRow(CurveIdentifier id);
	StreamModel getStreamModel() ;
	
	
	RoicComponent and(Set<CurveIdentifier> ids) ;
	
	//RoicComponent minus(RoicComponent other) ;
	
}
