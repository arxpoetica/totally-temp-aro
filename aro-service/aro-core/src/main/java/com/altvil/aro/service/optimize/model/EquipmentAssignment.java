package com.altvil.aro.service.optimize.model;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.AnalysisContext;

public interface EquipmentAssignment extends MaterialAssigment {

	boolean isRoot() ;
	boolean isSourceEquipment() ;
	
	public GraphEdgeAssignment getGraphAssignment() ;

	public boolean rebuildNetwork(GeneratingNode node, AnalysisContext ctx);
	public GraphMapping serialize(GeneratingNode node, ModelSerializer serializer) ;

	/**
	 * returns coverage for locations directly assigned to this equipment
	 */
	DemandCoverage getDirectCoverage(AnalysisContext ctx);

	FiberProducer createFiberProducer(AnalysisContext ctx, FiberType fiberType, FiberConsumer fiberConsumer) ;
}
