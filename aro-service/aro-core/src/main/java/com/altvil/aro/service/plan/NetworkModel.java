package com.altvil.aro.service.plan;

import java.util.Collection;

import com.altvil.aro.service.entity.EquipmentLinker;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.assigment.impl.FiberSourceMapping;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.interfaces.NetworkAssignment;

public interface NetworkModel {

	public NetworkAssignment getFiberSourceAssignment() ;
	public FiberSourceMapping getFiberSourceMapping() ;

	public GraphMapping getGraphMapping(GraphAssignment ga) ;
	
	public GraphNode getVertex(FiberType fiberType, GraphAssignment graphAssignment) ;
	
	public GeneratedFiberRoute getCentralOfficeFeederFiber() ;
	public GeneratedFiberRoute getFiberRouteForFdh(GraphAssignment ga) ;
	
	public Collection<EquipmentLinker> getRejectedEquipmentLinkers() ;
	
	
			

}