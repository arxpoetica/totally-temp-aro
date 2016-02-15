package com.altvil.aro.service.plan;

import java.util.Collection;
import java.util.Map;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.assigment.impl.FiberSourceMapping;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.interfaces.NetworkAssignment;

public interface NetworkModel {

	public NetworkAssignment getFiberSourceAssignment() ;
	public FiberSourceMapping getFiberSourceMapping() ;

	public GraphMapping getGraphMapping(GraphAssignment ga) ;
	
	public GraphNode getVertex(GraphAssignment graphAssignment) ;
	
	public Collection<AroEdge<GeoSegment>> getCentralOfficeFeederFiber() ;
	public Collection<AroEdge<GeoSegment>> getFiberRouteForFdh(GraphAssignment ga) ;
			
	public NetworkModel createNetworkModel(Collection<AroEdge<GeoSegment>> feederFiber, Map<GraphAssignment, 
			Collection<AroEdge<GeoSegment>>> distributionFiber, FiberSourceMapping co) ;
}