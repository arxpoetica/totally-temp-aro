package com.altvil.aro.service.plan;

import java.util.Optional;

import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.price.PricingModel;

public interface CoreLeastCostRoutingService {
	
	public interface LcrContext {
		PricingModel getPricingModel() ;
		FtthThreshholds getFtthThreshholds() ;
		ClosestFirstSurfaceBuilder getClosestFirstSurfaceBuilder() ;
	}

	Optional<CompositeNetworkModel> computeNetworkModel(
			GraphNetworkModel model, LcrContext lcrContext) throws PlanException;
	

}
