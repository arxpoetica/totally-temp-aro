package com.altvil.aro.service.conversion;

import java.util.Optional;

import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

public interface SerializationService {
	
	WirecenterNetworkPlan convert(int planId, Optional<CompositeNetworkModel> model) ; 

}
