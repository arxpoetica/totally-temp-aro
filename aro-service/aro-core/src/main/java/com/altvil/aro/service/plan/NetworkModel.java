package com.altvil.aro.service.plan;

import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.assigment.impl.FiberSourceMapping;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.interfaces.NetworkAssignment;

public interface NetworkModel {

	public NetworkAssignment getFiberSourceAssignment() ;
	public FiberSourceMapping getFiberSourceMapping() ;

	public GraphMapping getGraphMapping(GraphAssignment ga) ;
	
	public GraphNode getVertex(GraphAssignment graphAssignment) ;
	
	public GeneratedFiberRoute getCentralOfficeFeederFiber() ;
	public GeneratedFiberRoute getFiberRouteForFdh(GraphAssignment ga) ;
	
	
			

}