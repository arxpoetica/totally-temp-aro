package com.altvil.aro.service.graph.builder.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.TreeMap;
import java.util.stream.Collectors;

import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.CableConstructionEnum;

public class CableEdgeMerger {

	private TreeMap<Double, CableConduitEdge> edgeMap = new TreeMap<>();

	public CableEdgeMerger reset() {
		edgeMap.clear(); 
		return this ;
	}
	
	public Collection<CableConduitEdge> merge(Collection<CableConduitEdge> edges) {
		
		if( edges.size() <= 1 ) {
			return edges ;
 		}
		
		Map<CableConstructionEnum, List<CableConduitEdge>> map = edges
				.stream()
				.collect(
						Collectors
								.groupingBy(CableConduitEdge::getCableConstructionEnum));
		List<CableConstructionEnum> list  = new ArrayList<>(map.keySet()) ;
		Collections.sort(list) ;
		list.forEach(edgeType -> {
			map.get(edgeType).forEach(this::add);
		});
		
		return new ArrayList<>(edgeMap.values()) ;
		
	}

	private void add(CableConduitEdge edge) {

		List<CableConduitEdge> segments = scanSegments(edge.getStartRatio(),
				edge.getEndRatio());

		if (!segments.isEmpty()) {
			CableConduitEdge startSegment = segments.get(0);
			CableConduitEdge endSegment = segments.get(segments.size() - 1);

			if (edge.getCableConstructionEnum().equals(
					startSegment.getCableConstructionEnum())) {
				edge = edge.expandLower(startSegment.getStartRatio());
			} else {
				write(startSegment.splitLower(edge.getStartRatio()));
			}

			if (edge.getCableConstructionEnum().equals(
					endSegment.getCableConstructionEnum())) {
				edge = edge.expandHigher(startSegment.getEndRatio());
			} else {
				write(endSegment.splitHigher(edge.getEndRatio()));
			}
		}

		// Finally Write the Edge
		write(edge);

	}

	private void write(CableConduitEdge edge) {
		if (edge.isValid()) {
			edgeMap.put(edge.getStartRatio(), edge);
		}
	}

	private NavigableMap<Double, CableConduitEdge> getNavigableMap(double lhs) {

		if (edgeMap.get(lhs) != null) {
			return edgeMap.tailMap(lhs, true);
		}

		Map.Entry<Double, CableConduitEdge> lowerEntry = edgeMap
				.lowerEntry(lhs);

		if (lowerEntry == null) {
			return edgeMap.tailMap(0.0, false);
		}

		return edgeMap.tailMap(lowerEntry.getKey(), true);

	}

	private List<CableConduitEdge> scanSegments(double lhs, double rhs) {

		List<CableConduitEdge> result = new ArrayList<>();
		NavigableMap<Double, CableConduitEdge> navMap = getNavigableMap(lhs);

		if (!navMap.isEmpty()) {
			Double key = navMap.firstKey();
			do {
				CableConduitEdge ce = navMap.get(key);
				if (ce.getStartRatio() >= lhs || ce.getEndRatio() <= rhs) {
					result.add(ce);
					navMap.remove(key);
				}

				key = navMap.higherKey(key);

			} while (key != null && key <= rhs);
		}

		return result;

	}
}
