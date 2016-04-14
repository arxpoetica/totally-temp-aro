package com.altvil.aro.service.optimize.model;

import java.util.Collection;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.optimize.spi.AnalysisContext;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;

public interface GeneratingNode extends AnalysisNode,
		Comparable<GeneratingNode> {

	AnalysisContext getAnalysisContext() ;
	
	FiberAssignment getFiberAssignment();

	EquipmentAssignment getEquipmentAssignment();
	
	FiberProducer getFiberProducer() ;
	FiberConsumer getFiberConsumer() ;
	
	void remove();

	GeneratingNode relink(GeneratingNode parent, FiberAssignment fiber);

	NetworkAnalysis getNetworkAnalysis();

	GeneratingNode getParent();

	Collection<GeneratingNode> getChildren();

	
	boolean isValueNode();

	boolean isJunctionNode();
	
	interface Builder {
		
		Builder addCompositeChild(FiberAssignment fiberAssignment)  ;
		
		Builder addChild(FiberAssignment fiberAssignment, EquipmentAssignment equipment);
		
		GraphEdgeAssignment getParentAssignment() ;
		
		GraphEdgeAssignment getAssignment() ;
		
		boolean isInitMode() ;
		void setInitMode(boolean mode) ;

		GeneratingNode build();
	}

}
