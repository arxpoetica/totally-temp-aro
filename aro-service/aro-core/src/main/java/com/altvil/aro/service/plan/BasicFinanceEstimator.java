package com.altvil.aro.service.plan;

import java.util.Collection;
import java.util.Set;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class BasicFinanceEstimator {
	private static final double		  EQUIPMENT_PER_COVERAGE = 76.5;

	private static final double		  FIBER_PER_M			 = 17.32;

	private double cost;

	private double equipmentCost = 0.0;

	private double fiberCost;

	private double length;

	private int	   numLocations;

	private double totalDemand;

	private double revenue;

	public BasicFinanceEstimator(DAGModel<GeoSegment> model) {
		financials(model.getEdges());
	}

	private void financials(AroEdge<GeoSegment> edge) {
		GeoSegment segment = edge.getValue();
		
		double edgeLength = (segment == null ? edge.getWeight() : segment.getLength());

		length += edgeLength;
		fiberCost += edgeLength * FIBER_PER_M;
		
		if (segment != null) {
			Collection<GraphEdgeAssignment> assignments = segment.getGeoSegmentAssignments();

			assignments.forEach((assignment) -> {
				LocationEntity le = (LocationEntity) assignment.getAroEntity();
				LocationDemand d = le.getLocationDemand();
				final double demandOfLocation = d.getDemand();
				equipmentCost += demandOfLocation * EQUIPMENT_PER_COVERAGE;
				revenue += d.getMonthlyRevenueImpact() * 12;
				numLocations++;
				totalDemand += demandOfLocation;
			});
		}
		cost = fiberCost + equipmentCost;
	}

	private void financials(Set<AroEdge<GeoSegment>> edges) {
		edges.stream().forEach((e) -> financials(e));
	}

	public double getCost() {
		return cost;
	}

	public double getEquipmentCost() {
		return equipmentCost;
	}

	public double getFiberCost() {
		return fiberCost;
	}

	public double getLength() {
		return length;
	}

	public int getNumLocations() {
		return numLocations;
	}

	public double getRawCoverage() {
		return totalDemand;
	}

	public double getRevenue() {
		return revenue;
	}
}