package com.altvil.aro.service.optimize.spi;

import java.util.Collection;
import java.util.Optional;

import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.interfaces.NetworkAssignment;

public interface NetworkModelBuilder {

	FtthThreshholds getFtthThreshholds() ;
	Collection<NetworkAssignment> getNetworkAssignments() ;
	Optional<CompositeNetworkModel> createModel(Collection<Long> rejectedLocations);

}