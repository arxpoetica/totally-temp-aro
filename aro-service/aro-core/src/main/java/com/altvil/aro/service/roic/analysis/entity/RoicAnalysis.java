package com.altvil.aro.service.roic.analysis.entity;

import com.altvil.aro.service.roic.analysis.entity.NetworkAnalysis.NetworkAnalysisType;

public interface RoicAnalysis {

	NetworkAnalysis getNetworkAnalysis(NetworkAnalysisType type);

}
