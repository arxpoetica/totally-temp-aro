package com.altvil.aro.service.optimize.spi.impl;

import java.util.Collection;
import java.util.Optional;

import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.graph.builder.CoreGraphNetworkModelService;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.optimize.FTTHOptimizerService.OptimizerContextBuilder;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilder;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilderFactory;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.CoreLeastCostRoutingService;
import com.altvil.aro.service.plan.NetworkAssignmentModelFactory;
import com.altvil.aro.service.plan.impl.LcrContextImpl;

@Service
public class NetworkModelBuilderFactoryImpl implements
		NetworkModelBuilderFactory {

	
	public NetworkModelBuilderFactoryImpl() {
		super();
	}

	@Override

	public NetworkModelBuilder create(NetworkData networkData,
			OptimizerContextBuilder constraintBuilder) {
		return new NetworkModelBuilderImpl(networkData, constraintBuilder);
	}

	@SuppressWarnings("serial")
	public static class NetworkModelBuilderImpl implements NetworkModelBuilder {

		private OptimizerContextBuilder constraintBuilder;
		private NetworkData networkData;

		public NetworkModelBuilderImpl(NetworkData networkData,
				OptimizerContextBuilder constraintBuilder) {

			this.constraintBuilder = constraintBuilder;
			this.networkData = networkData;

		}

		private NetworkData createNetworkData(Collection<Long> rejectedLocations) {
			if (rejectedLocations.size() == 0) {
				return networkData;
			}
			
			NetworkData nd = new NetworkData();
			nd.setFiberSources(networkData.getFiberSources());
			nd.setRoadEdges(networkData.getRoadEdges());
			nd.setRoadLocations(new NetworkAssignmentModelFactory(networkData.getRoadLocations(), na -> !rejectedLocations.contains(na.getSource().getObjectId())).build());
			nd.setCableConduitEdges(networkData.getCableConduitEdges());

			return nd;

		}

		/*
		 * (non-Javadoc)
		 * 
		 * @see
		 * com.altvil.aro.service.optimize.spi.NetworkModelBuilder#createModel
		 * (java.util.Collection)
		 */
		@Override

		public Optional<CompositeNetworkModel> createModel(
				ApplicationContext appCtx, Collection<Long> rejectedLocations) {

			OptimizerContext ctx = constraintBuilder
					.createOptimizerContext(appCtx);

			GraphNetworkModel networkModel = appCtx.getBean(
					CoreGraphNetworkModelService.class)
					.createGraphNetworkModel(
							createNetworkData(rejectedLocations),
							ctx.getGraphBuilderContext());

			return appCtx
					.getBean(CoreLeastCostRoutingService.class)
					.computeNetworkModel(networkModel, LcrContextImpl.create(ctx.getPricingModel(), ctx.getFtthThreshholds()));

		}
	}
}
