package com.altvil.aro.service.optimize;

import java.util.Collection;
import java.util.Optional;

import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.optimize.model.AnalysisNode;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.interfaces.NetworkAssignment;

public interface OptimizedNetwork {

	public FtthThreshholds getFiberNetworkConstraints() ;
	public Collection<NetworkAssignment> getSouceNetworkAssignments() ;

	public boolean isEmpty() ;

	public AnalysisNode getAnalysisNode();
	public Optional<CompositeNetworkModel> getNetworkPlan() ;
	
	

}
