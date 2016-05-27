package com.altvil.aro.service.roic.analysis;

import com.altvil.aro.service.roic.penetration.NetworkPenetration;


public interface AnalysisService {
	
	PeriodFunction createCurve(NetworkPenetration networkPenetration)  ;
	
}
