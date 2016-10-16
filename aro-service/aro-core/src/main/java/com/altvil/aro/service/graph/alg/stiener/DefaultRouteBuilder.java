package com.altvil.aro.service.graph.alg.stiener;

import java.io.Closeable;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import org.jgrapht.GraphPath;
import org.jgrapht.Graphs;
import org.jgrapht.WeightedGraph;
import org.jgrapht.alg.DijkstraShortestPath;
import org.jgrapht.graph.DefaultWeightedEdge;
import org.jgrapht.graph.GraphPathImpl;
import org.jgrapht.graph.SimpleWeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.GraphPathConstraint;
import com.altvil.aro.service.graph.alg.GraphPathConstraint.MetricDistance;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.SourceRoute;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class DefaultRouteBuilder<V, E extends AroEdge<GeoSegment>> implements
		SpanningRouteBuilder<V, E> {

	// private static final Logger log = LoggerFactory
	// .getLogger(AbstractRouteBuilder.class.getName());

	private ClosestRouteStrategy<V, E> closestRouteStrategy;
	private SourceGraph<V, E> sourceGraph;
	private GraphPathConstraint<V, E> pathPredicate;
	
	private Collection<V> allRoots;
	private Collection<V> assignedTargets;

	private WeightedGraph<V, E> analysisGraph ;
	private WeightedGraph<V, E> metricGraph ;
	
	private Map<V, SourceRoute<V, E>> sourceRootMap = new HashMap<>();

	public DefaultRouteBuilder(ClosestRouteStrategy<V, E> closestRouteStrategy,
			SourceGraph<V, E> sourceGraph,
			GraphPathConstraint<V, E> pathPredicate, Collection<V> allRoots,
			Collection<V> assignedTargets) {
		super();
		this.closestRouteStrategy = closestRouteStrategy;
		this.sourceGraph = sourceGraph;
		this.pathPredicate = pathPredicate;
		this.allRoots = allRoots;
		this.assignedTargets = assignedTargets;
	}

	@Override
	public Collection<SourceRoute<V, E>> build() {

		this.metricGraph = sourceGraph.getMetricGraph() ;
		
		try (VirtualRoot vr = createVirtualRoot(metricGraph,
				allRoots)) {
			
			this.analysisGraph = sourceGraph.createAnalysisGraph(metricGraph) ;

			SelectedTargets selectedTargets = new SelectedTargets(vr.getRoot(),
					pathPredicate, metricGraph, assignedTargets);

			return this.build(vr, selectedTargets);
		} catch (IOException err) {
			throw new RuntimeException(err.getMessage(), err);
		}

	}

	@SuppressWarnings("serial")
	private static class FailedNetworkNode extends Exception {

		private Collection<Object> failedNodes;

		public FailedNetworkNode(Collection<Object> failedNodes) {
			super();
			this.failedNodes = failedNodes;
		}

		public Collection<Object> getFailedNodes() {
			return failedNodes;
		}

	}

	// protected Predicate<V> createVertexPredicate(Collection<V> allSources,
	// Collection<V> allTargets, GraphPathConstraint<V, E> pathPredicate) {
	// MetricDistance<V> md = (V) -> 0.0;
	//
	// Map<V, SpanningShortestPath<V, E>> map = new HashMap<>();
	// allTargets.forEach(t -> {
	// map.put(t, this.createSpanningShortestPath(t));
	// });
	//
	// return (target) -> {
	//
	// SpanningShortestPath<V, E> ssp = map.get(target);
	//
	// for (V source : allSources) {
	// if (ssp.findClosestTarget(source) != null
	// && pathPredicate.isValid(md, ssp.getGraphPath(source))) {
	// return true;
	// }
	// }
	//
	// log.error("Vertex Fails Network Constaint " + target);
	//
	// return false;
	// };
	//
	// // return this.closestRouteStrategy.vertexPredicate(allRoots,
	// // pathPredicate) ;
	// }

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.graph.alg.SpanningRouteBuilder#build(com.altvil
	 * .aro.service.graph.alg.GraphPathConstraint, org.jgrapht.WeightedGraph,
	 * java.util.Collection, java.util.Collection)
	 */

	@SuppressWarnings("unchecked")
	private Collection<SourceRoute<V, E>> build(VirtualRoot virtualRoot,
			SelectedTargets selectedTargets) {

		// Filter out any vertices that fail Network Constraint
		// This will simplify network Algorithm as Precondition will be
		// satisfied that all vertices are Valid.
		//
		// This will also cause the network to fail Vertices Fast
		//

		// Predicate<V> predicate = createVertexPredicate(virtualRoot, targets,
		// pathPredicate);
		//
		// targets = targets.stream().filter(predicate)
		// .collect(Collectors.toList());

		// Track All Vertices that caused previous network generation to fail.

		int maxCount = 10;
		int count = 1;
		while (count < maxCount) {
			try {
				return build(virtualRoot, selectedTargets, count == maxCount);
			} catch (FailedNetworkNode err) {
				log.info("Failed to route network plan .. rebuilding "
						+ err.getFailedNodes());
				selectedTargets.addFailingTargets((Collection<V>) err
						.getFailedNodes());
				count++;
			}
		}

		throw new RuntimeException("Failed to route network plan");

	}

	private Collection<SourceRoute<V, E>> build(VirtualRoot virtualRoot,
			SelectedTargets selectedTargets, boolean forceNetwork)
			throws FailedNetworkNode {

		Collection<V> forcedTargets = new ArrayList<>(
				selectedTargets.getFailingVertices());

		// Establish Root Structures
		Set<V> roots = new HashSet<>(virtualRoot.getSources());

		sourceRootMap.clear();
		roots.forEach(v -> {
			sourceRootMap.put(v, new SourceRoute<>(this.analysisGraph, v));
		});

		List<SourceRoute<V, E>> originalSources = new ArrayList<>(
				sourceRootMap.values());

		// Reset Target
		Map<V, SpanningShortestPath<V, E>> targetMap = new HashMap<>();

		for (V target : selectedTargets.getTargets()) {
			// Exclude any source target match

			if (roots.contains(target)) {
				// Update Root Structure
				// Distance still bound at 0
				sourceRootMap.get(target).add(
						new GraphPathImpl<V, E>(this.analysisGraph, target,
								target, new ArrayList<>(), 0.0));
			} else {
				SpanningShortestPath<V, E> ssp = createSpanningShortestPath(target);
				targetMap.put(target, ssp);
			}
		}

		// Handle rejected Locations
		if (forcedTargets.size() > 0) {
			Map<V, SpanningShortestPath<V, E>> forcedMap = new HashMap<>();
			for (V v : forcedTargets) {
				forcedMap.put(v, targetMap.remove(v));
			}
			assemble(virtualRoot, forcedMap, forceNetwork);
		}

		assemble(virtualRoot, targetMap, forceNetwork);

		return originalSources;
	}

	protected SpanningShortestPath<V, E> createSpanningShortestPath(V source) {
		return closestRouteStrategy.createSpanningShortestPath(source);
	}

	private Collection<V> toFailedNodes(TreeMap<Double, V> treeMap) {
		return treeMap.descendingMap().values();
	}

	@SuppressWarnings("unchecked")
	private void assemble(VirtualRoot virtualRoot, Map<V, SpanningShortestPath<V, E>> targetMap,
			boolean force) throws FailedNetworkNode {

		Collection<V> previousPath = Collections.singleton(virtualRoot.getRoot());

		// Track all Sources
		while (targetMap.size() > 0) {

			ClosestTarget<V, E> closestSource = this.getClosestSource(
					previousPath, targetMap);

			// Boundary Condition
			// Caused by failure to connect Path OR Invalid Path
			if (!closestSource.isValidPath()) {
				if (closestSource.hasFailedTargets()) {
					throw new FailedNetworkNode(
							(Collection<Object>) toFailedNodes(closestSource
									.getFailedTargets()));
				} else {
					break; // Caused buy diconnected graph
				}

			}

			// returns the closest SpanningPath
			SpanningGraphPath<V, E> path = closestSource.getClosestPath();

			// Bind f(v) -> SourceRoot
			SourceRoute<V, E> sourceRoot = sourceRootMap.get(path.getEndVertex());
			
			//remove satisfied target
			targetMap.remove(path.getStartVertex());
		
			//Track Spanning Path
			sourceRoot.add(path);
			
			// Filters out all Empty Spanning Paths
			if (path.getEdgeList().size() == 0) {
				continue;
			}

			//
			List<V> pathList = path.getReverseVertexList() ;
			Iterator<V> itr = pathList.iterator() ;

			V endVertex = itr.next();
			double distanceToSource = sourceRoot.getDistance(endVertex);

			V previous = endVertex;

			// This will not update the target Vertex as already assigned
			while (itr.hasNext()) {
				V next = itr.next();

				// Update the vertex bound to SourceRoot
				sourceRootMap.put(next, sourceRoot);

				E e = this.analysisGraph.getEdge(previous, next);
				// TODO remove this condition
				if (e != null) {
					distanceToSource += e.getValue().getLength();
				}

				// Keep Track of distance to source
				sourceRoot.add(next, distanceToSource);
				previous = next;
			}

			// Assign Previous Targets
			previousPath = pathList;
		}

	}

	private ClosestTarget<V, E> getClosestSource(Collection<V> deltaSources,
			Map<V, SpanningShortestPath<V, E>> targetMap) {

		ClosestTarget<V, E> closestSource = new ClosestTarget<>();

		TreeMap<Double, SpanningShortestPath<V, E>> treeMap = new TreeMap<>();
		for (V target : targetMap.keySet()) {
			SpanningShortestPath<V, E> ssp = targetMap.get(target);
			treeMap.put(ssp.updateNetworkPath(deltaSources), ssp);
		}

		for (SpanningShortestPath<V, E> ssp : treeMap.values()) {
			SpanningGraphPath<V, E> path = ssp.getGraphPath();
			if (isValidPath(path)) {
				closestSource.assignPath(path);
				break;
			} else {
				closestSource.addFailedTarget(ssp.getWeight(),
						path.getStartVertex());
			}
		}

		return closestSource;
	}

	private boolean isValidPath(GraphPath<V, E> path) {
		return pathPredicate.isValid(sourceRootMap.get(path.getEndVertex()),
				path);
	}

	@SuppressWarnings("unused")
	private static class Validator<V> {

		private SimpleWeightedGraph<V, DefaultWeightedEdge> g;

		private V root;

		public Validator(V root) {
			super();
			this.root = root;
			g = new SimpleWeightedGraph<V, DefaultWeightedEdge>(
					DefaultWeightedEdge.class);
		}

		public void add(V start, V end, double w) {

			g.addVertex(start);
			g.addVertex(end);

			DefaultWeightedEdge e = g.addEdge(start, end);
			if (e == null) {

			} else {
				g.setEdgeWeight(e, w);
			}

		}

		public void validate(V v) {

			if (root.equals(v)) {
				return;
			}

			if (DijkstraShortestPath.findPathBetween(g, root, v) == null) {
				throw new RuntimeException("Failed");
			}
		}

	}

	private static class ClosestTarget<V, E extends AroEdge<GeoSegment>> {

		private SpanningGraphPath<V, E> closestPath;
		private TreeMap<Double, V> failedTargets = null;

		public ClosestTarget() {
		}

		public ClosestTarget<V, E> assignPath(SpanningGraphPath<V, E> path) {
			this.closestPath = path;
			return this;
		}

		public boolean isValidPath() {
			return closestPath != null;
		}

		public void addFailedTarget(Double val, V vertex) {
			if (failedTargets == null) {
				failedTargets = new TreeMap<>();
			}
			failedTargets.put(val, vertex);
		}

		public boolean hasFailedTargets() {
			return failedTargets != null && failedTargets.size() > 0;
		}

		public TreeMap<Double, V> getFailedTargets() {
			return failedTargets;
		}

		public SpanningGraphPath<V, E> getClosestPath() {
			return closestPath;
		}

	}

//	private static class ReverseIterator<T> implements Iterator<T> {
//
//		private int index;
//		private List<T> list;
//
//		public ReverseIterator(List<T> list) {
//			super();
//			this.list = list;
//			this.index = list.size() - 1;
//		}
//
//		@Override
//		public boolean hasNext() {
//			return index >= 0;
//		}
//
//		@Override
//		public T next() {
//			return list.get(index--);
//		}
//
//	}

	private VirtualRoot createVirtualRoot(WeightedGraph<V, E> graph,
			Collection<V> sources) {
		return new VirtualRoot(graph, sources);
	}

	private class VirtualRoot implements Closeable {
		private WeightedGraph<V, E> graph;
		private Collection<E> virtualEdges;

		private V root;
		private Collection<V> sources;
		
		public VirtualRoot(WeightedGraph<V, E> graph,
			Collection<V> sources) {
			this.graph = graph ;
			this.sources  = sources ;
			
			addVirtualRoot(sources);
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
		
		private void addVirtualRoot(Collection<V> sources) {
			root = sourceGraph.getVertexSupplier().get() ;
			sources.forEach(s -> {
				E edge = graph.addEdge(s, root) ;
				graph.setEdgeWeight(edge, 0) ;
				virtualEdges.add(edge) ;
			});
		}

		private void removeRootEdges(Collection<E> edges) {
			edges.forEach(e -> {
				graph.removeEdge(e);
			});
		}

	}

	private class SelectedTargets implements MetricDistance<V> {

		private V source;
		private GraphPathConstraint<V, E> pathPredicate;
		private WeightedGraph<V, E> graph;

		private ScalarClosestFirstSurfaceIterator<V, E> itr;
		private Map<V, Double> map = new HashMap<>();
		private Map<V, Double> rejected = new HashMap<>();
		private TreeMap<Double, V> failingVertices = new TreeMap<>();

		public SelectedTargets(V source,
				GraphPathConstraint<V, E> pathPredicate,
				WeightedGraph<V, E> graph, Collection<V> targets) {
			super();
			this.source = source;
			this.pathPredicate = pathPredicate;
			this.graph = graph;

			this.itr = new ScalarClosestFirstSurfaceIterator<>(graph, source);
			init(targets);
		}

		public void addFailingTargets(Collection<V> vertices) {
			V v = findFurthestVertex(vertices);
			failingVertices.put(getTargetDistance(v), v);
		}

		public Collection<V> getFailingVertices() {
			return failingVertices.values();
		}

		private V findFurthestVertex(Collection<V> vertices) {
			double max = Double.POSITIVE_INFINITY;
			V selected = null;

			for (V v : vertices) {
				if (selected == null) {
					selected = v;
				} else {
					double distance = map.get(v);
					if (distance > max) {
						max = distance;
						selected = v;
					}
				}
			}
			return selected;
		}

		public Collection<V> getTargets() {
			return map.keySet();
		}

		public double getTargetDistance(V vertex) {
			return map.get(vertex);
		}

		private void init(Collection<V> targets) {
			targets.forEach(v -> {
				index(v);
			});
		}

		@Override
		public double getDistance(V vertex) {
			return 0;
		}

		private GraphPath<V, E> createGraphPath(V endVertex, double pathLength) {
			List<E> edgeList = new ArrayList<E>();

			V v = endVertex;

			while (true) {
				E edge = itr.getSpanningTreeEdge(v);

				if (edge == null) {
					break;
				}

				edgeList.add(edge);
				v = Graphs.getOppositeVertex(graph, edge, v);
			}

			return new GraphPathImpl<V, E>(graph, endVertex, source, edgeList,
					pathLength);
		}

		private void index(V vertex) {
			double pathLength = find(vertex);
			if (pathPredicate
					.isValid(this, createGraphPath(vertex, pathLength))) {
				map.put(vertex, find(vertex));
			} else {
				rejected.put(vertex, pathLength);
			}
		}

		private double find(V vertex) {
			if (!itr.isTraversedVertex(vertex)) {
				while (itr.hasNext() && !(itr.next() == vertex))
					;
			}
			return itr.getShortestPathLength(vertex);
		}
	}

	private static final Logger log = LoggerFactory
			.getLogger(DefaultRouteBuilder.class.getName());

}
