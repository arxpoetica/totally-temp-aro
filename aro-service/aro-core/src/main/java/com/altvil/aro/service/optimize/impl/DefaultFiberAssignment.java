package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;
import com.altvil.aro.service.optimize.spi.AnalysisContext;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

public class DefaultFiberAssignment implements FiberAssignment {

	private Collection<AroEdge<GeoSegment>> edges;
	private double fiberLengthMeters;
	private FiberType fiberType;

	public DefaultFiberAssignment(FiberType fiberType,
			Collection<AroEdge<GeoSegment>> edges) {
		super();
		this.fiberType = fiberType;
		this.edges = edges;
		fiberLengthMeters = this.edges.stream().collect(
				Collectors.summingDouble(AroEdge::getWeight));
	}

	@Override
	public Collection<AroEdge<GeoSegment>> getEdges() {
		return edges;
	}

	@Override
	public double getCost(AnalysisContext ctx, FiberConsumer fiberConsumer,
			FiberProducer fiberProducer, DemandCoverage coverage) {
		return ctx.getPricingModel().getFiberCostPerMeter(fiberType, fiberProducer.getFiberCount())
				* fiberLengthMeters;
	}

	public double getFiberLengthInMeters() {
		return fiberLengthMeters;
	}

	@Override
	public FiberAssignment union(FiberAssignment other) {
		Set<AroEdge<GeoSegment>> combined = new HashSet<>();

		combined.addAll(getEdges());
		combined.addAll(other.getEdges());

		return new DefaultFiberAssignment(fiberType, combined);
	}

	@Override
	public FiberType getFiberType() {
		return fiberType;
	}

}
