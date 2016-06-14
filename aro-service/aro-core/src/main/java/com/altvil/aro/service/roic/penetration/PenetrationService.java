package com.altvil.aro.service.roic.penetration;


public interface PenetrationService {
	

	NetworkPenetration createNetworkTypePenetration(PenetrationInput input) ;
	NetworkPenetration calculateRate(PenetrationHistory history, double targetFairShare) ;


}
