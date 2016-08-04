package com.altvil.aro.service.plan;

import java.util.Set;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface GeneratedFiberRoute {
	
	boolean isEmpty() ;
	GraphNode getSourceVertex() ;
	Set<AroEdge<GeoSegment>> getEdges() ;
	DAGModel<GeoSegment> createDagModel(GraphModelBuilder<GeoSegment> builder) ;

}
