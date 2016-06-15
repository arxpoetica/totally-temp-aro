package com.altvil.aro.service.roic.analysis.model;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;

public interface RoicNetworkModel {

	public enum NetworkAnalysisType {
		undefined, bau, planned, incremental, copper, fiber, modified_copper,
	}
	
	/*
	 * 
	 *  bau -> copper
	 *  planned -> 
	 *  	fiber count
	 *  	copper flipped ratio
	 *  
	 *  incremental
	 * 
	 */

	public interface Transformer {
		Transformer setType(NetworkAnalysisType type) ;
		Transformer setModel(RoicNetworkModel model) ;
		Transformer setCurveIds(Collection<CurveIdentifier> ids) ;
		RoicNetworkModel apply() ;
	}
	
	
	Collection<RoicNetworkModel> getBaseModels() ;
	
	NetworkAnalysisType getNetworkAnalysisType();
	
	AnalysisRow getAnalysisRow(ComponentType type, CurveIdentifier id) ;
	AnalysisRow getAnalysisRow(CurveIdentifier id) ;
	
	RoicComponent getNetworkCurves() ;
	RoicComponent getEntityAnalysis(ComponentType type) ;
	
	Transformer add() ;
	Transformer difference() ;
	
	
}
