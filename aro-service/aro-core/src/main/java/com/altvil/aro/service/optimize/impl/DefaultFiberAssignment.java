package com.altvil.aro.service.optimize.impl;

import java.util.Collection;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;
import com.altvil.aro.service.optimize.spi.PricingContext;
import com.altvil.interfaces.CableConstructionEnum;

public class DefaultFiberAssignment implements FiberAssignment {

	private Collection<AroEdge<GeoSegment>> edges;
	private double fiberLengthMeters;
	private FiberType fiberType;

	private Map<CableConstructionEnum, Double> constructionLengthMap ; 
			
	
	public DefaultFiberAssignment(FiberType fiberType,
			Collection<AroEdge<GeoSegment>> edges) {
		super();
		this.fiberType = fiberType;
		this.edges = edges;
		
		constructionLengthMap = initMap(edges) ;
		fiberLengthMeters = constructionLengthMap.values().stream().mapToDouble(d -> d).sum() ;
		
	}

	private Map<CableConstructionEnum, Double> initMap(
			Collection<AroEdge<GeoSegment>> edges) {
		Map<CableConstructionEnum, Double> result = new EnumMap<>(
				CableConstructionEnum.class);

		edges.stream()
				.map(AroEdge::getValue)
				.collect(
						Collectors
								.groupingBy(GeoSegment::getCableConstructionCategory))
				.entrySet()
				.forEach(
						e -> {
							result.put(e.getKey(), e.getValue().stream()
									.mapToDouble(GeoSegment::getLength).sum());
						});
		
		return result;
	}

	@Override
	public Collection<AroEdge<GeoSegment>> getEdges() {
		return edges;
	}

	@Override
	public double getCost(PricingContext ctx, FiberConsumer fiberConsumer,
			FiberProducer fiberProducer, DemandCoverage coverage) {
		
		double total = 0 ;
		
		for(Map.Entry<CableConstructionEnum, Double> e : constructionLengthMap.entrySet()) {
			total += ctx.getPricingModel().getFiberCostPerMeter(fiberType,
					e.getKey(),
					fiberProducer.getFiberCount())
					* e.getValue();
		}
		
		return total ;
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

	public String toString() {
		return new ToStringBuilder(this)
				.append("fiberLengthMeters", fiberLengthMeters)
				.append("fiberType", fiberType)
				/* .append("edges", edges) */.toString();
	}
}
