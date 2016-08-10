package com.altvil.aro.service.optimize.impl;

import java.util.Optional;

import org.springframework.context.ApplicationContext;

import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.AnalysisNode;
import com.altvil.aro.service.optimize.spi.NetworkGenerator;
import com.altvil.aro.service.plan.CompositeNetworkModel;

public class LazyOptimizedNetwork implements OptimizedNetwork {

	private AnalysisNode anlysisNode;
	private NetworkGenerator supplier;
	private Optional<CompositeNetworkModel> model;
	
	public LazyOptimizedNetwork(AnalysisNode anlysisNode,
			NetworkGenerator supplier) {
		super();
		this.anlysisNode = anlysisNode;
		this.supplier = supplier;
	}

	@Override
	public boolean matches(OptimizedNetwork other) {
		return supplier.matches(other.getNetworkGenerator());
	}
	
	@Override
	public NetworkGenerator getNetworkGenerator() {
		return supplier;
	}

	@Override
	public boolean isEmpty() {
		return getAnalysisNode().getFiberCoverage().getAssignedEntityDemands()
				.isEmpty();
	}
	

	@Override
	public AnalysisNode getAnalysisNode() {
		return anlysisNode;
	}

	@Override
	public Optional<CompositeNetworkModel> getNetworkPlan(ApplicationContext appCtx) {
		if (model == null) {
			model = supplier.get(appCtx);
		}
		return model;
	}

}
