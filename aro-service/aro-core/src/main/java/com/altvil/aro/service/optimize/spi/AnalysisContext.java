package com.altvil.aro.service.optimize.spi;

import java.util.Collection;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.ftp.HubModel;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.optimize.PricingModel;
import com.altvil.aro.service.optimize.impl.FiberProducerConsumerFactory;
import com.altvil.aro.service.optimize.impl.SplitterNodeAssignment;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.model.GeneratingNode.Builder;
import com.altvil.aro.service.plan.NetworkModel;

public interface AnalysisContext {

	HubModel getHubModel();
	
	boolean debugVerify(AroEntity entity) ;
	
	FiberProducerConsumerFactory getFiberProducerConsumerFactory() ;
	
	FiberStrandConverter getFiberStrandConverter() ;

	PricingModel getPricingModel();

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

	Builder addNode(FiberAssignment fiberAssignment,
			Collection<GraphEdgeAssignment> assignments,
			GeneratingNode.Builder parent, GraphNode vertex);

	SplitterNodeAssignment createSplitterNodeAssignment() ;
	
	//Builder addSplitterNode(FiberAssignment fiberAssignment, GeneratingNode.Builder parent);
	
	//Builder addCompositeNode(FiberAssignment fiberAssignment, GeneratingNode.Builder parent) ;

}
