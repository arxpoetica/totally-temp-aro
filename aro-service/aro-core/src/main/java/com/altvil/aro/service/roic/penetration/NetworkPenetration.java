package com.altvil.aro.service.roic.penetration;


public interface NetworkPenetration {

	double getRate();

	double getStartPenetration();

	double getEndPenetration();
	
	
	
	NetworkPenetration zeroFairShare() ;
	NetworkPenetration modifyRate(double rate) ;
	

}
