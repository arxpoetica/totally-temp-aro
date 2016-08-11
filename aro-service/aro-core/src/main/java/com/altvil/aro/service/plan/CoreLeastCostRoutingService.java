package com.altvil.aro.service.plan;

import java.util.Optional;

import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.price.PricingModel;
import com.altvil.enumerations.OptimizationType;

public interface CoreLeastCostRoutingService {

	Optional<CompositeNetworkModel> computeNetworkModel(
			GraphNetworkModel model, PricingModel pricingModel,
			FtthThreshholds consraints) throws PlanException;

	boolean isRoutingServiceFor(OptimizationType type);

}
