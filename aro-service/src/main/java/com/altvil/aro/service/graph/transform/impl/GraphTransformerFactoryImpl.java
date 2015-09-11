package com.altvil.aro.service.graph.transform.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.jgrapht.EdgeFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.builder.impl.DefaultGraphBuilder;
import com.altvil.aro.service.graph.node.FDTNode;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.transform.FDHAssignments;
import com.altvil.aro.service.graph.transform.GraphTransformer;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.fdtx.FTTXScanner;
import com.google.inject.Inject;
import com.google.inject.Singleton;

@Singleton
public class GraphTransformerFactoryImpl implements GraphTransformerFactory {

	private GraphNodeFactory factory;

	@Inject
	public GraphTransformerFactoryImpl(GraphNodeFactory factory) {
		this.factory = factory;
	}

	@Override
	public GraphTransformer<AroEdge, Collection<FDTNode>> createBasicFDTTransformer(
			GraphModel<AroEdge> gm, int maxCount) {

		return new GraphTransformer<AroEdge, Collection<FDTNode>>() {
			@Override
			public Collection<FDTNode> apply(GraphModel<AroEdge> t) {
				List<FDTNode> result = new ArrayList<>();
				createFTTXTransformer(gm, maxCount, 100).apply(t).forEach(
						a -> {
							result.addAll(a.getFdtNodes());
						});

				return result;
			}

		};
	}

	@Override
	public <E extends AroEdge> GraphModelBuilder<E> createBuilder(
			EdgeFactory<GraphNode, E> edgeFactory) {
		return new DefaultGraphBuilder<E>(edgeFactory);
	}

	@Override
	public GraphTransformer<AroEdge, Collection<FDHAssignments>> createFTTXTransformer(
			GraphModel<AroEdge> gm, int maxFDTCount, int maxFDHCount) {

		return new FTTXScanner(this, gm.getGraph(), factory, maxFDTCount,
				maxFDHCount);

	}

}
