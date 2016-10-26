package com.altvil.aro.service.conversion;

import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

public interface SerializationService {
	
	WirecenterNetworkPlan convert(long planId, PlannedNetwork plannedNetwork) ; 

}
