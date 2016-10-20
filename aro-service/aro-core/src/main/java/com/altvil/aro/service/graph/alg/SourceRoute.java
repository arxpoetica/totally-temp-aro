package com.altvil.aro.service.graph.alg;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jgrapht.Graph;
import org.jgrapht.GraphPath;

import com.altvil.aro.service.graph.alg.routing.GraphPathConstraint.MetricLinkDistance;

public class SourceRoute<V, E> implements MetricLinkDistance<V> {
	

	private Graph<V, E> sourceGraph;
	private final V sourceVertex;

	private List<TargetRoute<V, E>> subRoutes = new ArrayList<>();

	private Set<V> targets = new HashSet<>();
	private Map<V, Double> distanceToSourceMap = new HashMap<>() ;
	

	public SourceRoute(Graph<V, E> sourceGraph, V sourceVertex) {
		super();
		this.sourceGraph = sourceGraph ;
		this.sourceVertex = sourceVertex;
		distanceToSourceMap.put(sourceVertex, 0.0) ;
	}
	
	public Graph<V, E> getSourceGraph() {
		return sourceGraph ;
	}

	public V getSourceVertex() {
		return sourceVertex;
	}
	
	public void add(V vertex, double distance) {
		distanceToSourceMap.put(vertex, distance) ;
	}
	
	@Override
	public double getLinkDistance(V vertex) {
		Double distance = distanceToSourceMap.get(vertex) ;
		return distance == null ? 0 : distance ;
	}

	public TargetRoutes<V, E> getSubRoutes() {
		return new TargetRoutes<>(subRoutes);
	}

	public void add(GraphPath<V, E> path) {
		targets.add(path.getStartVertex());
		subRoutes.add(new TargetRoute<>(path));
		
		
	}

	public Set<V> getTargets() {
		return targets;
	}

	
	// public DAGModel<GeoSegment> createDagModel(GraphModelBuilder<GeoSegment>
	// b) {
	// DagAssembler dagAssembler = new DagAssembler(b) ;
	// this.subRoutes.forEach(dagAssembler::updatePath);
	// return dagAssembler.assemble() ;
	// }
	

	public Set<E> getAllEdges() {
		Set<E> result = new HashSet<>();
		subRoutes.forEach(r -> result.addAll(r.getPath().getEdgeList()));
		return result;
	}


//
//	private class DagAssembler {
//
//		private GraphModelBuilder<GeoSegment> graphBuilder;
//		
//		private Collection<E> seenEdges = new HashSet<>();
//		
//		public DagAssembler(GraphModelBuilder<GeoSegment> graphBuilder) {
//			super();
//			this.graphBuilder = graphBuilder;
//		}
//
//		private void addEdge(E edge, V selectedSource,
//				V selectedTarget) {
//			V targetVertex = sourceGraph.getEdgeTarget(edge);
//			GeoSegment gs = edge.getValue();
//
//			if (!selectedTarget.equals(targetVertex)) {
//				gs = (GeoSegment) gs.reverse();
//			}
//
//			graphBuilder
//					.add((GraphNode) selectedSource, (GraphNode) selectedTarget, gs, gs.getLength());
//
//		}
//
//		public DagAssembler updatePath(TargetRoute<V, E> target) {
//			
//			GraphPath<V,E> path = target.getPath() ;
//			Iterator<V> verticies = Graphs.getPathVertexList(path).iterator() ;
//			List<E> edgeList = path.getEdgeList() ;
//			
//			V start = verticies.next() ;
//			
//			for (E e : edgeList) {
//				V end = verticies.next() ;
//				if (seenEdges.add(e)) {
//					addEdge(e, start, end);
//				}
//				start = end;
//			}
//			
//			return this ;
//		}
//		
//		public DAGModel<GeoSegment> assemble() {
//			return graphBuilder.buildDAG() ;
//		}
//
//	}
//
//	
//	private static class RoutingModelImpl<V, E extends AroEdge<GeoSegment>> {
//		private Set<GraphNode> sources ;
//		private Set<GraphNode> targets ;
//		private DirectedGraph<V, E>  simplified ;
//		
//		public boolean isSourceNode(GraphNode node) {
//			return sources.contains(node) ;
//		}
//		
//		public boolean isTargetNode(GraphNode node) {
//			return targets.contains(node) ;
//		}
//		
//	}

//	private static class SimplifiedDagBuilder<E extends AroEdge<GeoSegment>> {
//
//		private DirectedGraph<GraphNode, E> graph;
//		
//		public SimplifiedDagBuilder(DirectedGraph<GraphNode, E> graph) {
//			super();
//			this.graph = graph;
//		}
//		
//		public DagEdge<E> getRootDagEdge(GraphNode root) {
//			
//			Collection<DagEdge<E>> dags = dft(graph.incomingEdgesOf(root)) ;
//		
//			return null ;
//			
//		}
//
//		private DagEdge<E> dft(GraphNode v, DagEdgeImpl<E> de) {
//
//			Set<E> incomingEdges = graph.incomingEdgesOf(v);
//
//			if (incomingEdges.size() == 0) {
//				de.setSourceVertex(v);
//				return de;
//			}
//
//			if (incomingEdges.size() == 1) {
//				E edge = incomingEdges.iterator().next();
//				de.add(incomingEdges.iterator().next());
//				return dft(edge.getSourceNode(), de);
//			}
//
//			de.setChildren(dft(incomingEdges));
//			de.setSourceVertex(v);
//			return de;
//
//		}
//
//		private Collection<DagEdge<E>> dft(Collection<E> edges) {
//
//			// Partition Edges
//
//			List<DagEdge<E>> result = new ArrayList<>();
//
//			edges.forEach(e -> {
//				GraphNode source = e.getSourceNode();
//				GraphNode target = e.getTargetNode();
//				DagEdgeImpl<E> de = new DagEdgeImpl<>(target, e);
//				result.add(dft(source, de));
//			});
//
//			return result;
//		}
//
//	}

}
