package com.altvil.aro.service.roic.analysis.model;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.model.ComponentModel.EntityAnalysisType;

public interface RoicNetworkModel {

	public enum NetworkAnalysisType {
		bau, fiber, planned, incremental,
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
	
	AnalysisRow getAnalysisRow(EntityAnalysisType type, CurveIdentifier id) ;
	AnalysisRow getAnalysisRow(CurveIdentifier id) ;
	
	ComponentModel getNetworkCurves() ;
	ComponentModel getEntityAnalysis(EntityAnalysisType type) ;
	
	Transformer add() ;
	Transformer difference() ;
	
	
}
