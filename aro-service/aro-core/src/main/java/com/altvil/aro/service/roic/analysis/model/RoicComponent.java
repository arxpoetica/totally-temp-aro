package com.altvil.aro.service.roic.analysis.model;

import java.util.Collection;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.StreamModel;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
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
	
	
	RoicComponent add(RoicComponent other) ;
	RoicComponent add(Collection<RoicComponent> other) ;
	RoicComponent minus(RoicComponent other) ;
	
}
