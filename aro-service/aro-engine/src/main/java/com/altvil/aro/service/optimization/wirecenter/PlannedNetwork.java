package com.altvil.aro.service.optimization.wirecenter;

import java.util.Optional;

import com.altvil.aro.service.plan.CompositeNetworkModel;

public interface PlannedNetwork {

	Optional<CompositeNetworkModel> getPlannedNetwork() ;
}
