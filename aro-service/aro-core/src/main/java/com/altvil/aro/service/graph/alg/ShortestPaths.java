package com.altvil.aro.service.graph.alg;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.jgrapht.Graph;
import org.jgrapht.Graphs;
import org.jgrapht.WeightedGraph;
import org.jgrapht.traverse.ClosestFirstIterator;

public class ShortestPaths<V, E> {

	private WeightedGraph<V, E> graph;
	private GraphPathListener<V, E> listener;
	private V sourceVertex;
	private boolean reverse;

	private Set<V> targetVertices;
	private ClosestFirstIterator<V, E> itr;

	public ShortestPaths(WeightedGraph<V, E> graph,
			GraphPathListener<V, E> listener, V sourceVertex,
			Collection<V> targets, boolean reverse) {
		super();
		this.graph = graph;
		this.listener = listener;
		this.sourceVertex = sourceVertex;
		this.reverse = reverse;

		this.targetVertices = new HashSet<V>(targets);
		itr = new ClosestFirstIterator<V, E>(graph);
	}

	public ShortestPaths(WeightedGraph<V, E> graph,
			GraphPathListener<V, E> listener, V sourceVertex,
			Collection<V> targets) {
		this(graph, listener, sourceVertex, targets, true);
	}

	public void findPaths() {
		while (itr.hasNext()) {
			V n = itr.next();
			if (targetVertices.contains(n)) {
				targetVertices.remove(n);
				if (!recordFoundVertex(sourceVertex, n)
						|| targetVertices.size() == 0) {
					break;
				}

			}
		}
	}

	private boolean recordFoundVertex(V startVertex, V endVertex) {
		return listener.onPathFound(createGraphPath(graph, itr, startVertex,
				endVertex));
	}

	private DAGPath<V, E> createGraphPath(Graph<V, E> graph,
			ClosestFirstIterator<V, E> iter, V startVertex, V endVertex) {
		List<PathEdge<V, E>> edgeList = new ArrayList<>();

		V v = endVertex;

		while (true) {
			E edge = iter.getSpanningTreeEdge(v);

			if (edge == null) {
				break;
			}

			V next = Graphs.getOppositeVertex(graph, edge, v);

			edgeList.add(new PathEdge<V, E>(v, next, edge));
			v = next;
		}

		if (reverse) {
			Collections.reverse(edgeList);
		}
		double pathLength = iter.getShortestPathLength(endVertex);
		return new GraphPathEdgeImpl<V, E>(graph, startVertex, endVertex,
				edgeList, pathLength);
	}

}
