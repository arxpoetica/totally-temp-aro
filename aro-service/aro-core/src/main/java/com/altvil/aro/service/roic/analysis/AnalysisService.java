package com.altvil.aro.service.roic.analysis;

import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;


public interface AnalysisService {
	
	StreamFunction createCurve(NetworkPenetration networkPenetration)  ;
	
}
