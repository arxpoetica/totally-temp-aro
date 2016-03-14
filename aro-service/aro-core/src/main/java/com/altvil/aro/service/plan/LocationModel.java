package com.altvil.aro.service.plan;

import java.util.Collection;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;

public interface LocationModel {
	
	public Collection<GraphEdgeAssignment> getLocations() ;
	public double getHouseHoldCount() ;
	

}
