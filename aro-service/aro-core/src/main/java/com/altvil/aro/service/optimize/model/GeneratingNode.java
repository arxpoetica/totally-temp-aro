package com.altvil.aro.service.optimize.model;

import java.util.Collection;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.optimize.spi.AnalysisContext;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;

public interface GeneratingNode extends AnalysisNode,
		Comparable<GeneratingNode> {

	AnalysisContext getAnalysisContext() ;
	
	FiberAssignment getFiberAssignment();
	
	boolean isSourceEquipment() ;

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
		
		//Builder addChild(FiberAssignment fiberAssignment, EquipmentAssignment equipment);
		void addChild(Builder child) ;
		void addChildren(Collection<Builder> children) ;
		GeneratingNode build();
		GeneratingNode getGeneratingNode() ;
		


	}

}
