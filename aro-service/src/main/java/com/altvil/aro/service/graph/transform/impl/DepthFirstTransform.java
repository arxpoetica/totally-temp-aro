package com.altvil.aro.service.graph.transform.impl;

import org.jgrapht.traverse.GraphIterator;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.transform.GraphTransformer;

public abstract class DepthFirstTransform<S, T> implements GraphTransformer<S, T> {

	@Override
	public T apply(GraphModel<S> model) {

		GraphIterator<GraphNode, AroEdge<S>> itr = model.depthFirstItr();
		
		while (itr.hasNext()) {
			add(itr.next());
		}
	
		return build();
	}
	
	

	protected abstract T build();

	protected abstract void add(GraphNode node) ;

}