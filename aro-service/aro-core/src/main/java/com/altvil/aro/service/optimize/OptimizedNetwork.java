package com.altvil.aro.service.optimize;

import java.util.Optional;

import org.springframework.context.ApplicationContext;

import com.altvil.aro.service.optimize.model.AnalysisNode;
import com.altvil.aro.service.optimize.spi.NetworkGenerator;
import com.altvil.aro.service.plan.CompositeNetworkModel;

public interface OptimizedNetwork {

	public boolean matches(OptimizedNetwork  other) ;
	public NetworkGenerator getNetworkGenerator() ;
	public boolean isEmpty() ;

	public AnalysisNode getAnalysisNode();
	public Optional<CompositeNetworkModel> getNetworkPlan(ApplicationContext appCtx) ;
	
	

}
