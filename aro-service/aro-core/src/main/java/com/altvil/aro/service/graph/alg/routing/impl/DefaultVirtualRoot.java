package com.altvil.aro.service.graph.alg.routing.impl;

import java.io.Closeable;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.alg.routing.VirtualRoot;

public class DefaultVirtualRoot<V, E> implements Closeable, VirtualRoot<V, E> {

	private WeightedGraph<V, E> graph;
	private Collection<E> virtualEdges = new ArrayList<>();

	private V root;
	private boolean updateRoot ; 

	public DefaultVirtualRoot(WeightedGraph<V, E> graph, V root,
			Collection<V> sources) {

		this.root = root ;
		this.graph = graph;
		this.updateRoot = !graph.containsVertex(root) ;

		if( updateRoot ) {
			addVirtualRoot(root, sources);
		}
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.graph.alg.routing.VirtualRoot#getRoot()
	 */
	@Override
	public V getRoot() {
		return root;
	}
	

	@Override
	public void close() throws IOException {
		if( updateRoot ) {
			removeRootEdges(virtualEdges);
		}
	}

	private void addVirtualRoot(V root,
			Collection<V> sources) {
		graph.addVertex(root) ;
		sources.forEach(s -> {
			E edge = graph.addEdge(s, root);
			graph.setEdgeWeight(edge, 0);
			virtualEdges.add(edge);
		});
	}

	private void removeRootEdges(Collection<E> edges) {
		edges.forEach(e -> {
			graph.removeEdge(e);
		});
		graph.removeVertex(root) ;
	}

}