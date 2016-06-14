package com.altvil.aro.service.roic.analysis.impl;

import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;

public class AnalysisServiceImpl implements AnalysisService {

	@Override
	public StreamFunction createCurve(NetworkPenetration networkPenetration) {
		return new AnalysisCurve(networkPenetration) ;
	}

}
