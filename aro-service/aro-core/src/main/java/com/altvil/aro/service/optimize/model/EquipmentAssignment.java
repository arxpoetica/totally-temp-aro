package com.altvil.aro.service.optimize.model;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.AnalysisContext;

public interface EquipmentAssignment extends MaterialAssigment {

	boolean isRoot() ;
	boolean isSourceEquipment() ;
	boolean isJunctionNode() ;
	
	AroEntity getParentEntity() ;
	GraphEdgeAssignment getGraphAssignment() ;

	//boolean rebuildNetwork(GeneratingNode node, AnalysisContext ctx);
	void serialize(GeneratingNode node, ModelSerializer serializer) ;

	/**
	 * returns coverage for locations directly assigned to this equipment
	 */
	DemandCoverage getDirectCoverage(AnalysisContext ctx);

	FiberProducer createFiberProducer(AnalysisContext ctx, FiberType fiberType, FiberConsumer fiberConsumer) ;
}
