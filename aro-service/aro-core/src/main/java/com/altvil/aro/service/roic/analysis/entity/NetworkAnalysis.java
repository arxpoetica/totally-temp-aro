package com.altvil.aro.service.roic.analysis.entity;

import com.altvil.aro.service.roic.analysis.entity.EntityAnalysis.EntityAnalysisType;

public interface NetworkAnalysis {

	public enum NetworkAnalysisType {
		bau, planned, incremental,
	}

	NetworkAnalysisType getNetworkAnalysisType();
	
	EntityAnalysis getEntityAnalysis(EntityAnalysisType type) ;

}
