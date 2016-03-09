package com.altvil.aro.service.optimize.spi;

import java.util.Collection;
import java.util.function.Supplier;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.FiberType;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.ftp.HubModel;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.optimize.PricingModel;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.model.GeneratingNode.Builder;
import com.altvil.aro.service.plan.NetworkModel;

public interface AnalysisContext {

	public HubModel getHubModel();

	public PricingModel getPricingModel();

	public OptimizerContext getOptimizerContext();

	public GraphTransformerFactory getGraphTransformerFactory();

	public NetworkModel getNetworkModel();

	public NetworkAnalysis getNetworkAnalysis();

	public boolean isFullAnalysisMode();

	public void rebuildRequired(GeneratingNode node);

	public void changing_start(GeneratingNode node);

	public void changing_end(GeneratingNode node);

	public void addToAnalysis(GeneratingNode node);

	public void removeFromAnalysis(GeneratingNode node);

	public Builder addNode(FiberType fiberType,
			Collection<GraphAssignment> assignments,
			GeneratingNode.Builder parent, GraphNode vertex);

	public Builder addSplitterNode(GeneratingNode.Builder parent);

	Supplier<LocationDemand> getCoverageScoreSupplier();

}
