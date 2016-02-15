package com.altvil.aro.service.graph.segment.splitter;

import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface EdgeAssignment {
	
	public GraphNode getSource() ;
	public GraphNode getTarget() ;
	public GeoSegment getGeoSegment() ;
	public double getWeight() ;

}
