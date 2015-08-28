package com.altvil.aro.service.graph.transform.impl;

import org.jgrapht.event.VertexTraversalEvent;
import org.jgrapht.traverse.GraphIterator;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.impl.DefaultGraphTraversalListener;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.transform.GraphTransformer;

public abstract class DepthFirstTransform<T> implements GraphTransformer<T> {

	@Override
	public T apply(GraphModel model) {

		GraphIterator<GraphNode, AroEdge> itr = model.depthFirstItr();
		itr.addTraversalListener(new DefaultGraphTraversalListener<GraphNode, AroEdge>() {
			@Override
			public void vertexFinished(VertexTraversalEvent<GraphNode> e) {
				add(e.getVertex());
			}
		});

		while (itr.hasNext()) {
			itr.next();
		}

		return build();
	}

	protected abstract T build();

	protected abstract void add(GraphNode node) ;

}