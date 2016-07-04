package com.altvil.aro.service.roic.analysis.builder.model;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicModel;

public interface RoicBuilder {

	RoicBuilder setAnalysisPeriod(AnalysisPeriod period);

	RoicBuilder addRoicInputs(RoicInputs roicInputs);

	RoicModel build();

}
