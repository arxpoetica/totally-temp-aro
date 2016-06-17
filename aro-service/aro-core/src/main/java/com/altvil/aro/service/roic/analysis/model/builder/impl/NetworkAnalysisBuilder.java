package com.altvil.aro.service.roic.analysis.model.builder.impl;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public interface NetworkAnalysisBuilder {
	
	NetworkAnalysisBuilder setNetworkAnalysisType(NetworkAnalysisType type) ;
	NetworkAnalysisBuilder setAnalysisPeriod(AnalysisPeriod period) ;
	
	NetworkAnalysisBuilder setFixedCosts(double costs) ;
	NetworkAnalysisBuilder addRoicComponent(RoicComponent component) ;
	RoicNetworkModel build() ; 

}
