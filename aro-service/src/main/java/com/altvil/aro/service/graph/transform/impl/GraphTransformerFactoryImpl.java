package com.altvil.aro.service.graph.transform.impl;

import java.util.Collection;

import com.altvil.aro.service.graph.node.FDTNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.transform.GraphTransformer;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.google.inject.Inject;
import com.google.inject.Singleton;

@Singleton
public class GraphTransformerFactoryImpl implements GraphTransformerFactory {

	private GraphNodeFactory factory ;
	
	@Inject
	public GraphTransformerFactoryImpl(GraphNodeFactory factory) {
		this.factory  = factory ;
	}
	
	@Override
	public GraphTransformer<Collection<FDTNode>> createBasicFDTTransformer(
			int maxCount) {
		return new SimpleFdtBuilder(factory, maxCount);
	}
	
	
}
