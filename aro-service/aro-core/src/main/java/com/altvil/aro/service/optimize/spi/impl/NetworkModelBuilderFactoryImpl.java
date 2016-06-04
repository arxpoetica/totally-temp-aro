package com.altvil.aro.service.optimize.spi.impl;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilder;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilderFactory;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.utils.StreamUtil;
import com.google.inject.Inject;

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
	public NetworkModelBuilder create(NetworkData networkData, ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder,
			Function<AroEdge<GeoSegment>, Set<GraphNode>> selectedEdges,
			FtthThreshholds fiberConstraints, GlobalConstraint globalConstraints) {
		return new NetworkModelBuilderImpl(networkData, closestFirstSurfaceBuilder, selectedEdges, fiberConstraints, globalConstraints);
	}

	private class NetworkModelBuilderImpl implements NetworkModelBuilder {

		private NetworkData networkData;
		
		ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder;
		Function<AroEdge<GeoSegment>, Set<GraphNode>> selectedEdges;
		
		private FtthThreshholds constraints;
		private GlobalConstraint globalConstraints;

		private Map<Long, NetworkAssignment> map;

		private NetworkModelBuilderImpl(NetworkData networkData, ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder,
				Function<AroEdge<GeoSegment>, Set<GraphNode>> selectedEdges, 
				FtthThreshholds constraints, GlobalConstraint globalConstraints) {
			super();
			this.networkData = networkData;
			this.closestFirstSurfaceBuilder = closestFirstSurfaceBuilder;
			this.selectedEdges = selectedEdges;
			this.constraints = constraints;
			this.globalConstraints = globalConstraints;

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

			NetworkData nd = new NetworkData();
			nd.setFiberSources(networkData.getFiberSources());
			nd.setRoadEdges(networkData.getRoadEdges());
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
					createNetworkData(rejectedLocations), closestFirstSurfaceBuilder, selectedEdges, constraints, globalConstraints);
		}
	}
}
