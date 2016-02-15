package com.altvil.aro.service.optimize.spi.impl;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilder;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilderFactory;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadLocation;
import com.altvil.utils.StreamUtil;
import com.google.inject.Inject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class NetworkModelBuilderFactoryImpl implements
		NetworkModelBuilderFactory {

	private PlanService planService;

	@Autowired
	@Inject
	public NetworkModelBuilderFactoryImpl(PlanService planService) {
		super();
		this.planService = planService;
	}

	@Override
	public NetworkModelBuilder create(NetworkData networkData,
			FiberNetworkConstraints fiberConstraints) {
		return new NetworkModelBuilderImpl(networkData, fiberConstraints);
	}

	private class NetworkModelBuilderImpl implements NetworkModelBuilder {

		private NetworkData networkData;
		private FiberNetworkConstraints constraints;

		private Map<Long, RoadLocation> map;

		private NetworkModelBuilderImpl(NetworkData networkData,
										FiberNetworkConstraints constraints) {
			super();
			this.networkData = networkData;
			this.constraints = constraints;

			map = StreamUtil.hash(networkData.getRoadLocations(),
					RoadLocation::getId);
		}


		@Override
		public FiberNetworkConstraints getFiberNetworkConstraints() {
			return constraints;
		}

		@Override
		public Collection<NetworkAssignment> getNetworkAssignments() {
			return networkData.getFiberSources() ;
		}

		private NetworkData createNetworkData(Collection<Long> rejectedLocations) {
			if (rejectedLocations.size() == 0) {
				return networkData;
			}

			Map<Long, RoadLocation> map = new HashMap<>(this.map);

			rejectedLocations.forEach(map::remove);

			NetworkData nd = new NetworkData();
			nd.setFiberSources(networkData.getFiberSources());
			nd.setRoadEdges(networkData.getRoadEdges());
			nd.setRoadLocationsProperties(networkData.getRoadLocationsProperties());
			nd.setRoadLocations(map.values());

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
		public Optional<CompositeNetworkModel> createModel(Collection<Long> rejectedLocations) {
			return planService.computeNetworkModel(
					createNetworkData(rejectedLocations), constraints);
		}

	}

}
