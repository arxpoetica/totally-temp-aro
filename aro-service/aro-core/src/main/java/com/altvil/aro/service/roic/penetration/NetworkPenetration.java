package com.altvil.aro.service.roic.penetration;

import com.altvil.aro.service.roic.model.NetworkType;

public interface NetworkPenetration {
	
	NetworkType getNetworkType() ;
	
	int getPeriodInMonths() ;
	double getStartPenetration() ;
	double getEndPenetration() ;
	
	//TODO Other ad

}
