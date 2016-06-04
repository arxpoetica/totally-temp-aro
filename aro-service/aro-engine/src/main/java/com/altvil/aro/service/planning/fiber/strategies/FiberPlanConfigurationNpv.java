package com.altvil.aro.service.planning.fiber.strategies;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.function.Function;

import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.NpvClosestFirstIterator;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.planning.NpvFiberPlan;

public class FiberPlanConfigurationNpv extends FiberPlanConfiguration implements NpvFiberPlan {
	private static final long serialVersionUID = 1L;
	final double			  discountRate;
	final int				  years;
	final double			  budget;

	public FiberPlanConfigurationNpv(NpvFiberPlan fiberPlan) {
		super(fiberPlan);
		this.budget = fiberPlan.getBudget();
		this.discountRate = fiberPlan.getDiscountRate();
		this.years = fiberPlan.getYears();
	}

	@Override
	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder() {
		return (p, g, s) -> new NpvClosestFirstIterator<GraphNode, AroEdge<GeoSegment>>
		(p, getDiscountRate(), getYears(), g, s);
	}

	public double getBudget() {
		return budget;
	}

	public double getDiscountRate() {
		return discountRate;
	}

	@Override
	public Function<AroEdge<GeoSegment>, Set<GraphNode>> getSelectedEdges(NetworkData networkData) {
		return (e) -> {
			GeoSegment value = e.getValue();

			if (value == null) {
				return Collections.emptySet();
			}
			Collection<Long> selectedRoadLocationIds = networkData.getSelectedRoadLocationIds();

			// There may be multiple marked locations on this edge so it may be
			// necessary to return both vertices of this edge.
			Set<GraphNode> selectedNodes = new HashSet<>();
			for (GraphEdgeAssignment geoSegmentAssignment : value.getGeoSegmentAssignments()) {
				Object ae = geoSegmentAssignment.getAroEntity();
				if (ae instanceof LocationEntity) {
					LocationEntity le = (LocationEntity) ae;

					if (selectedRoadLocationIds.contains(le.getObjectId())) {
						if (geoSegmentAssignment.getPinnedLocation().isAtStartVertex()) {
							selectedNodes.add(e.getSourceNode());
						} else {
							selectedNodes.add(e.getTargetNode());
						}
					}
				}

			}

			return selectedNodes;
		};
	}

	public int getYears() {
		return years;
	}

	@Override
	public boolean isFilteringRoadLocationDemandsBySelection() {
		return false;
	}

	@Override
	public boolean isFilteringRoadLocationsBySelection() {
		return false;
	}

}
