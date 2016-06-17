package com.altvil.aro.service.roic.analysis.model;

import java.util.Collection;
import java.util.Set;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.calc.StreamModel;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.registry.CurveRegistry;

public interface RoicComponent extends CurveRegistry {
	
	public enum ComponentType {
		undefined,
		household,
		business,
		cellTower,
		network,
		
	}
	
	Collection<CurveIdentifier> getCurveIdentifiers() ;

	AnalysisPeriod getAnalysisPeriod() ;
	ComponentType getComponentType() ;
	AnalysisRow getAnalysisRow(CurveIdentifier id);
	StreamModel getStreamModel() ;
	
	
	RoicComponent and(Set<CurveIdentifier> ids) ;
	RoicComponent add(RoicComponent other) ;
	RoicComponent add(Collection<RoicComponent> other) ;
	
	RoicComponent minus(RoicComponent other) ;
	
}
