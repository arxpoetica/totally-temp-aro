package com.altvil.aro.service.roic.analysis.entity;

import com.altvil.aro.service.roic.analysis.entity.ComponentModel.EntityAnalysisType;

public interface RoicNetworkModel {

	public enum NetworkAnalysisType {
		bau, planned, incremental,
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

	NetworkAnalysisType getNetworkAnalysisType();
	
	ComponentModel getEntityAnalysis(EntityAnalysisType type) ;
	
	ComponentModel add(ComponentModel other) ;
	ComponentModel difference(ComponentModel other) ;
	
}
