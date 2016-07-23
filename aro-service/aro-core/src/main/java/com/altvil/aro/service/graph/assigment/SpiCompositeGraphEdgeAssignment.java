package com.altvil.aro.service.graph.assigment;

import java.util.Collection;

public interface SpiCompositeGraphEdgeAssignment extends GraphEdgeAssignment {
	
	 void add(GraphEdgeAssignment assignemnt) ;
	 Collection<GraphEdgeAssignment> getGraphEdgeAssignments() ;

}
