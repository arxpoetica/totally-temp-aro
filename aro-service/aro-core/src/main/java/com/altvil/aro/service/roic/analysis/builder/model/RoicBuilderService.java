package com.altvil.aro.service.roic.analysis.builder.model;

import com.altvil.aro.service.roic.analysis.builder.Aggregator;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public interface RoicBuilderService {

	public abstract RoicBuilder buildModel();

	public abstract Aggregator<NetworkAnalysisType, RoicModel> aggregate();

}