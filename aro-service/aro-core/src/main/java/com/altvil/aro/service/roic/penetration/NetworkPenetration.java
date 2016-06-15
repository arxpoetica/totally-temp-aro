package com.altvil.aro.service.roic.penetration;


public interface NetworkPenetration {

	double getRate();

	double getStartPenetration();

	double getEndPenetration();
	
	
	NetworkPenetration negate(NetworkPenetration other) ;
	

}
