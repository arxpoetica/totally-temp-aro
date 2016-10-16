package com.altvil.aro.service.graph.alg.routing;

import java.io.Closeable;
import java.io.IOException;
import java.util.Collection;

import org.jgrapht.WeightedGraph;

public class VirtualRoot<V, E> implements Closeable {

	private WeightedGraph<V, E> graph;
	private Collection<E> virtualEdges;

	private V root;
	private Collection<V> sources;

	public VirtualRoot(WeightedGraph<V, E> graph, V root,
			Collection<V> sources) {

		this.root = root ;
		this.graph = graph;
		this.sources = sources;

		addVirtualRoot(root, sources);
	}

	public V getRoot() {
		return root;
	}

	public Collection<V> getSources() {
		return sources;
	}

	@Override
	public void close() throws IOException {
		removeRootEdges(virtualEdges);
	}

	private void addVirtualRoot(V root,
			Collection<V> sources) {
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
	}

}