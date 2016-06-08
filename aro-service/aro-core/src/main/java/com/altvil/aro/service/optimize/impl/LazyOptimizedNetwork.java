package com.altvil.aro.service.optimize.impl;

import java.util.Collection;
import java.util.Optional;
import java.util.function.Supplier;

import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.AnalysisNode;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilder;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.interfaces.NetworkAssignment;

public class LazyOptimizedNetwork implements OptimizedNetwork {

	private AnalysisNode anlysisNode ;
	private Supplier<Optional<CompositeNetworkModel>> supplier;
	private Optional<CompositeNetworkModel> model;
	private NetworkModelBuilder networkModelBuilder ;
	
	public LazyOptimizedNetwork(AnalysisNode anlysisNode,
								Supplier<Optional<CompositeNetworkModel>> supplier,
								NetworkModelBuilder networkModelBuilder) {
		super();
		this.anlysisNode = anlysisNode;
		this.supplier = supplier;
		this.networkModelBuilder = networkModelBuilder ;
	}
	
	
	

	@Override
	public boolean isEmpty() {
		 return getAnalysisNode().getFiberCoverage().getAssignedEntityDemands().isEmpty() ;
	}




	@Override
	public FtthThreshholds getFiberNetworkConstraints() {
		return networkModelBuilder.getFtthThreshholds() ;
	}



	@Override
	public Collection<NetworkAssignment> getSouceNetworkAssignments() {
		return networkModelBuilder.getNetworkAssignments() ;
	}


	@Override
	public AnalysisNode getAnalysisNode() {
		return anlysisNode ;
	}

	@Override
	public Optional<CompositeNetworkModel> getNetworkPlan() {
		if( model == null ) {
			model = supplier.get();
		}
		return model ;
	}

}
