package com.altvil.aro.service.roic.analysis.builder.network;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public interface NetworkBuilder {
	
	NetworkBuilder setNetworkAnalysisType(NetworkAnalysisType type) ;
	NetworkBuilder setAnalysisPeriod(AnalysisPeriod period) ;
	NetworkBuilder set(RoicInputs roicInputs) ;
	
	RoicNetworkModel build() ; 

}
