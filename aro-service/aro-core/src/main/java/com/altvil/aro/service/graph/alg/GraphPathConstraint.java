package com.altvil.aro.service.graph.alg;

import org.jgrapht.GraphPath;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface GraphPathConstraint<V, E extends AroEdge<GeoSegment>> {

	boolean isValid(SourceRoute<V, E> sourceRoot, GraphPath<V, E> graph);

}
