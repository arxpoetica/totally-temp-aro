package com.altvil.aro.service.optimize.spi;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.optimize.impl.FiberProducerConsumerFactory;
import com.altvil.aro.service.optimize.impl.SplitterNodeAssignment;
import com.altvil.aro.service.optimize.model.EquipmentAssignment;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.model.GeneratingNode.Builder;
import com.altvil.aro.service.plan.NetworkModel;

public interface AnalysisContext extends PricingContext {
	
	boolean debugContains(GeneratingNode node) ;
	
	boolean debugVerify(AroEntity entity) ;
	
	FiberProducerConsumerFactory getFiberProducerConsumerFactory() ;
	
	FiberStrandConverter getFiberStrandConverter() ;

	OptimizerContext getOptimizerContext();

	GraphTransformerFactory getGraphTransformerFactory();

	NetworkModel getNetworkModel();
	
	ParentResolver getParentResolver() ;

	NetworkAnalysis getNetworkAnalysis();

	boolean isFullAnalysisMode();

	void rebuildRequired(GeneratingNode node);

	void changing_start(GeneratingNode node);

	void changing_end(GeneratingNode node);

	ScoringStrategy getScoringStrategy();

	void addToAnalysis(GeneratingNode node);

	void removeFromAnalysis(GeneratingNode node);
	
	Builder createNode(FiberAssignment fiberAssignment, EquipmentAssignment equipment); ;
	
	SplitterNodeAssignment createSplitterNodeAssignment() ;
	
	//Builder addSplitterNode(FiberAssignment fiberAssignment, GeneratingNode.Builder parent);
	
	//Builder addCompositeNode(FiberAssignment fiberAssignment, GeneratingNode.Builder parent) ;

}
