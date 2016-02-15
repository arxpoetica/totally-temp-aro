package com.altvil.aro.service.optimize.spi;

import java.util.Collection;
import java.util.Optional;

import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.interfaces.NetworkAssignment;

public interface NetworkModelBuilder {

	FiberNetworkConstraints getFiberNetworkConstraints() ;
	Collection<NetworkAssignment> getNetworkAssignments() ;
	Optional<CompositeNetworkModel> createModel(Collection<Long> rejectedLocations);

}