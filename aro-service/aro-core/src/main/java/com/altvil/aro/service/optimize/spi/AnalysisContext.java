package com.altvil.aro.service.optimize.spi;

import java.util.Collection;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.ftp.HubModel;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.optimize.PricingModel;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.model.GeneratingNode.Builder;
import com.altvil.aro.service.plan.NetworkModel;

public interface AnalysisContext {

	HubModel getHubModel();

	PricingModel getPricingModel();

	OptimizerContext getOptimizerContext();

	GraphTransformerFactory getGraphTransformerFactory();

	NetworkModel getNetworkModel();

	NetworkAnalysis getNetworkAnalysis();

	boolean isFullAnalysisMode();

	void rebuildRequired(GeneratingNode node);

	void changing_start(GeneratingNode node);

	void changing_end(GeneratingNode node);

	ScoringStrategy getScoringStrategy();

	void addToAnalysis(GeneratingNode node);

	void removeFromAnalysis(GeneratingNode node);

	Builder addNode(FiberType fiberType,
			Collection<GraphAssignment> assignments,
			GeneratingNode.Builder parent, GraphNode vertex);

	Builder addSplitterNode(GeneratingNode.Builder parent);

}
