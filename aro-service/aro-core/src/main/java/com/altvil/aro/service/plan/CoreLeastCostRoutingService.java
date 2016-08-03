package com.altvil.aro.service.plan;

import java.util.Optional;

import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.price.PricingModel;

public interface CoreLeastCostRoutingService {

	Optional<CompositeNetworkModel> computeNetworkModel(
			GraphNetworkModel model, PricingModel pricingModel,
			FtthThreshholds consraints) throws PlanException;

}
