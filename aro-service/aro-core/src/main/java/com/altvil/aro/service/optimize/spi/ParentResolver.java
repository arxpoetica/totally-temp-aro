package com.altvil.aro.service.optimize.spi;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;

public interface ParentResolver {
	
	GraphEdgeAssignment getParentAssignment(GraphEdgeAssignment assignment) ;

}
