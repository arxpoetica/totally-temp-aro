package com.altvil.aro.service.graph.alg;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.jgrapht.DirectedGraph;
import org.jgrapht.Graph;
import org.jgrapht.Graphs;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class SourceRoute<E extends AroEdge<GeoSegment>> {

	private Graph<GraphNode, E> sourceGraph;
	private final GraphNode sourceVertex;
	

	private Collection<E> seenEdges;
	private GraphModelBuilder<GeoSegment> graphBuilder;

	private List<TargetRoute<GraphNode, E>> subRoutes = new ArrayList<>();
	
	private Set<GraphNode> targets = new HashSet<>();

	public SourceRoute(GraphNode sourceVertex) {
		super();
		this.sourceVertex = sourceVertex;
	}

	public V getSourceVertex() {
		return sourceVertex;
	}

	public TargetRoutes<GraphNode, E> getSubRoutes() {
		return new TargetRoutes<>(subRoutes);
	}

	private void addEdge(E edge, V selectedSource, V selectedTarget) {
		V targetVertex = sourceGraph.getEdgeTarget(edge);
		GeoSegment gs = edge.getValue();

		if (!selectedTarget.equals(targetVertex)) {
			gs = (GeoSegment) gs.reverse();
		}

		graphBuilder.add((GraphNode) selectedSource,
				(GraphNode) selectedTarget, gs, gs.getLength());

	}

	private void updatePath(V startVertex, List<E> path) {
		V start = startVertex;
		for (E e : path) {
			V end = Graphs.getOppositeVertex(sourceGraph, e, start);
			if (seenEdges.add(e)) {
				addEdge(e, start, end);
			}
			start = end;
		}
	}

	public void add(V src, V target, List<E> path) {
		targets.add(src);
		subRoutes.add(new TargetRoute<>(target, src, path));
		//updatePath(src, path); // Convert To DAG then to updated structure
	}

	public Set<V> getTargets() {
		return targets;
	}
	
	public DagEdge<V,E> getRootEdge() {
	
		return null ;
	}

	public Set<E> getAllEdges() {
		Set<E> result = new HashSet<>();
		subRoutes.forEach(r -> result.addAll(r.getPath()));
		return result;
	}

	private static class DagEdgeImpl<V, E extends AroEdge<GeoSegment>> implements DagEdge<V, E> {

		private V sourceVertex;
		private V targetVertex;
		private Collection<E> edges = new ArrayList<>();

		private Collection<DagEdge<V, E>> children = Collections.emptyList();

		public DagEdgeImpl(V targetVertex, E edge) {
			super();
			this.targetVertex = sourceVertex;
			this.edges.add(edge);
		}

		/* (non-Javadoc)
		 * @see com.altvil.aro.service.graph.alg.DagEdge#getSourceVertex()
		 */
		@Override
		public V getSourceVertex() {
			return sourceVertex;
		}

		/* (non-Javadoc)
		 * @see com.altvil.aro.service.graph.alg.DagEdge#getTargetVertex()
		 */
		@Override
		public V getTargetVertex() {
			return targetVertex;
		}

		/* (non-Javadoc)
		 * @see com.altvil.aro.service.graph.alg.DagEdge#getEdges()
		 */
		@Override
		public Collection<E> getEdges() {
			return edges;
		}

		/* (non-Javadoc)
		 * @see com.altvil.aro.service.graph.alg.DagEdge#getChildren()
		 */
		@Override
		public Collection<DagEdge<V, E>> getChildren() {
			return children;
		}

		public void setSourceVertex(V vertex) {
			this.sourceVertex = vertex;
		}

		public void add(E edge) {
			this.edges.add(edge) ;
		}

		public void setChildren(Collection<DagEdge<V, E>> children) {
			this.children = children;
		}

	}

	private static class SimplifiedBuilder<V, E extends AroEdge<GeoSegment>> {

		private DirectedGraph<V, E> graph;
		
		public SimplifiedBuilder(DirectedGraph<V, E> graph) {
			super();
			this.graph = graph;
		}

		private DagEdge<V, E> dft(V v, DagEdgeImpl<V, E> de) {

			Set<E> incomingEdges = graph.incomingEdgesOf(v);

			if (incomingEdges.size() == 0) {
				de.setSourceVertex(v) ;
				return de;
			}

			if (incomingEdges.size() == 1) {
				E edge = incomingEdges.iterator().next();
				de.add(incomingEdges.iterator().next());
				return dft((V) edge.getSourceNode(), de);
			}

			de.setChildren(dft(incomingEdges));
			de.setSourceVertex(v) ;
			return de;

		}

		private Collection<DagEdge<V, E>> dft(Collection<E> edges) {

			// Partition Edges

			List<DagEdge<V, E>> result = new ArrayList<>();

			edges.forEach(e -> {
				V source = (V) e.getSourceNode() ;
				V target = (V) e.getTargetNode();
				DagEdgeImpl<V, E> de = new DagEdgeImpl<>(target, e);
				result.add(dft(source     , de));
			});

			return result;
		}

	}

}
