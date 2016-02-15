package com.altvil.aro.service.optimize;

import com.altvil.aro.service.optimize.model.AnalysisNode;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.interfaces.NetworkAssignment;

import java.util.Collection;
import java.util.Optional;

public interface OptimizedNetwork {

	public FiberNetworkConstraints getFiberNetworkConstraints() ;
	public Collection<NetworkAssignment> getSouceNetworkAssignments() ;

	public boolean isEmpty() ;

	public AnalysisNode getAnalysisNode();
	public Optional<CompositeNetworkModel> getNetworkPlan() ;
	
	

}
