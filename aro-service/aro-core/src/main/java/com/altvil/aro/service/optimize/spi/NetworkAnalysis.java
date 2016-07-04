package com.altvil.aro.service.optimize.spi;

import java.util.Collection;
import java.util.Optional;
import java.util.function.Predicate;

import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.optimize.model.AnalysisNode;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.plan.CompositeNetworkModel;

public interface NetworkAnalysis {
	public NetworkModelBuilder getNetworkModelBuilder() ;
	
	public Optional<CompositeNetworkModel> createNetworkModel() ;
	
	public AnalysisNode getAnalyisNode();

	public GeneratingNode getMinimumNode(Predicate<GeneratingNode> predicate);

	public NetworkGenerator lazySerialize() ;

	public Optional<CompositeNetworkModel> serialize();
	
	public Collection<LocationEntity> getRejectetedLocations() ;

}
