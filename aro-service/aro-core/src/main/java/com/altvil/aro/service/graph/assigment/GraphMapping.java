package com.altvil.aro.service.graph.assigment;

import java.util.Collection;

import com.altvil.aro.service.entity.AroEntity;

public interface GraphMapping {
	
	public AroEntity getAroEntity() ;
	public GraphEdgeAssignment getGraphAssignment() ;
	public Collection<GraphMapping> getChildren() ;
	public Collection<GraphEdgeAssignment> getChildAssignments() ; 
	

}
