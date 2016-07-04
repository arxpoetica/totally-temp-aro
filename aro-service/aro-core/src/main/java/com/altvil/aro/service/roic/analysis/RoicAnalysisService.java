package com.altvil.aro.service.roic.analysis;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicModel;

public interface RoicAnalysisService {
	
	RoicModel createRoicModel(Collection<RoicInputs> inputs) ;

}
