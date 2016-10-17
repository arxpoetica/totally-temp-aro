package com.altvil.aro.service.graph.alg.routing;

import java.io.Closeable;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;

import org.jgrapht.WeightedGraph;

public class VirtualRoot<V, E> implements Closeable {

	private WeightedGraph<V, E> graph;
	private Collection<E> virtualEdges = new ArrayList<>();

	private V root;
	private Collection<V> sources;
	private boolean updateRoot ; 

	public VirtualRoot(WeightedGraph<V, E> graph, V root,
			Collection<V> sources) {

		this.root = root ;
		this.graph = graph;
		this.sources = sources;
		this.updateRoot = !graph.containsVertex(root) ;

		if( updateRoot ) {
			addVirtualRoot(root, sources);
		}
	}

	public V getRoot() {
		return root;
	}

	public Collection<V> getSources() {
		return sources;
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