package com.altvil.aro.service.graph.assigment;

import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;


public interface GraphEdgeAssignment extends GraphAssignment {

	public PinnedLocation getPinnedLocation() ;
	
	public GeoSegment getGeoSegment() ;
	
	//TODO Pass in GraphModel and associate Edges with Graph Models
	
	/*
	 * GraphEsgeAssignments will maintain identity through transforms 
	 */
	public GraphEdgeAssignment getAsRootEdgeAssignment() ;
	
}
