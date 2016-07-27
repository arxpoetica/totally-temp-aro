package com.altvil.aro.service.optimize.spi.impl;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilder;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilderFactory;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.LeastCostRoutingService;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.utils.StreamUtil;
import com.google.inject.Inject;

@Service
public class NetworkModelBuilderFactoryImpl implements
		NetworkModelBuilderFactory {

	private LeastCostRoutingService planService;

	@Autowired
	@Inject
	public NetworkModelBuilderFactoryImpl(LeastCostRoutingService planService) {
		super();
		this.planService = planService;
	}

	@Override
	public NetworkModelBuilder create(NetworkData networkData,
			FtthThreshholds fiberConstraints) {
		return new NetworkModelBuilderImpl(networkData, fiberConstraints);
	}

	private class NetworkModelBuilderImpl implements NetworkModelBuilder {

		private NetworkData networkData;
		
		private FtthThreshholds constraints;
		
		private Map<Long, NetworkAssignment> map;

		private NetworkModelBuilderImpl(NetworkData networkData, 
				FtthThreshholds constraints) {
			super();
			this.networkData = networkData;
			this.constraints = constraints;
		
			map = StreamUtil.hash(networkData.getRoadLocations(),
					a -> a.getSource().getObjectId());
		}

		@Override
		public FtthThreshholds getFtthThreshholds() {
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

			Map<Long, NetworkAssignment> map = new HashMap<>(this.map);

			rejectedLocations.forEach(map::remove);
			
			Set<Long> selectedRoadLocationIds = new HashSet<Long> (this.networkData.getSelectedRoadLocationIds());
			rejectedLocations.forEach(selectedRoadLocationIds::remove);

			NetworkData nd = new NetworkData();
			nd.setFiberSources(networkData.getFiberSources());
			nd.setRoadEdges(networkData.getRoadEdges());
			nd.setRoadLocations(map.values());
			nd.setSelectedRoadLocationIds(selectedRoadLocationIds);

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
