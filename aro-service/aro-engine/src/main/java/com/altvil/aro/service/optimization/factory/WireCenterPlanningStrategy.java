package com.altvil.aro.service.optimization.factory;

import java.util.Optional;

import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;

public interface WireCenterPlanningStrategy {
	
	Optional<PlannedNetwork> optimize() ;

}
