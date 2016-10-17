package com.altvil.aro.service.graph.alg.routing.impl;

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

import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.SourceRoute;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;
import com.altvil.aro.service.graph.alg.routing.GraphPathConstraint;
import com.altvil.aro.service.graph.alg.routing.GraphPathConstraint.MetricDistance;
import com.altvil.aro.service.graph.alg.routing.VirtualRoot;
import com.altvil.aro.service.graph.alg.routing.spi.ClosestRouteStrategy;
import com.altvil.aro.service.graph.alg.routing.spi.MetricEdgeWeight;
import com.altvil.aro.service.graph.alg.routing.spi.SpanningGraphPath;
import com.altvil.aro.service.graph.alg.routing.spi.SpanningTreeAlgorithm;
import com.altvil.aro.service.graph.alg.routing.spi.StrategyLarge;
import com.altvil.aro.service.graph.alg.routing.spi.StrategySmall;

public class SpanningTreeAlgorithmImpl<V, E> implements
		SpanningTreeAlgorithm<V, E> {

	// private static final Logger log = LoggerFactory
	// .getLogger(AbstractRouteBuilder.class.getName());

	private static int largeStrategyThreshold = 10000;

	private ClosestRouteStrategy<V, E> closestRouteStrategy;
	private SourceGraph<V, E> sourceGraph;
	private GraphPathConstraint<V, E> pathPredicate;
	private boolean isPathPredicateActive;
	private MetricEdgeWeight<E> metricEdgeWeight;
	private Collection<V> assignedTargets;

	private VirtualRoot<V, E> virtualRoot;
	private WeightedGraph<V, E> analysisGraph;
	private WeightedGraph<V, E> metricGraph;

	private Map<V, SourceRoute<V, E>> sourceRootMap = new HashMap<>();

	public SpanningTreeAlgorithmImpl(MetricEdgeWeight<E> metricEdgeWeight,
			SourceGraph<V, E> sourceGraph,
			GraphPathConstraint<V, E> pathPredicate,
			Collection<V> assignedTargets) {
		super();
		this.metricEdgeWeight = metricEdgeWeight;
		this.sourceGraph = sourceGraph;
		this.virtualRoot = sourceGraph.getVirtualRoot();
		this.pathPredicate = pathPredicate;
		this.assignedTargets = assignedTargets;

		if (this.pathPredicate == null) {
			this.pathPredicate = (metric, path) -> true;
			this.isPathPredicateActive = false;
		} else {
			this.isPathPredicateActive = true;
		}

	}

	private ClosestRouteStrategy<V, E> createClosestRouteStrategy(
			WeightedGraph<V, E> weightedGraph, WeightedGraph<V, E> metricGraph,
			Collection<V> targets) {
		return (targets.size() <= largeStrategyThreshold) ? new StrategySmall<V, E>(
				weightedGraph, metricGraph) : new StrategyLarge<V, E>(
				weightedGraph, metricGraph);

	}

	@Override
	public Collection<SourceRoute<V, E>> build() {

		this.metricGraph = sourceGraph.getMetricGraph();
		this.analysisGraph = sourceGraph.getAnalysisGraph();

		SelectedTargets selectedTargets = (isPathPredicateActive) ? new ConstrainedSelectedTargets(
				virtualRoot.getRoot(), pathPredicate, metricGraph,
				assignedTargets) : new UnconstrainedTargets(assignedTargets);

		this.closestRouteStrategy = createClosestRouteStrategy(
				this.analysisGraph, this.metricGraph,
				selectedTargets.getTargets());

		return this.build(virtualRoot, selectedTargets);

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

	@SuppressWarnings("unchecked")
	private Collection<SourceRoute<V, E>> build(VirtualRoot<V, E> virtualRoot,
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

		int maxCount = 100;
		int count = 1;
		V lastFailure = null;
		boolean force = false;
		while (count < maxCount) {
			try {
				return build(virtualRoot, selectedTargets, force);
			} catch (FailedNetworkNode err) {

				V v = ((Collection<V>) err.getFailedNodes()).iterator().next();
				if (v == lastFailure) {
					log.info("Detected Network Loop Failure ... rebuilding forced Network "
							+ count + " => "
							+ err.getFailedNodes());
					lastFailure = null ;
					force = true;
				} else {
					log.info("Failed to route network plan ... rebuilding optimal route  count =  "
							+ count + " => "
							+ err.getFailedNodes());
					
					selectedTargets.addFailingTargets((Collection<V>) err
							.getFailedNodes());
				}
				lastFailure = v;
				count++;
			}
		}

		throw new RuntimeException("Failed to route network plan : "
				+ selectedTargets.getFailingVertices());

	}

	private Collection<SourceRoute<V, E>> build(VirtualRoot<V, E> virtualRoot,
			SelectedTargets selectedTargets, boolean forceNetwork)
			throws FailedNetworkNode {

		Collection<V> forcedTargets = new HashSet<>(
				selectedTargets.getFailingVertices());

		// Establish Root Structures
		Set<V> roots = new HashSet<>(virtualRoot.getSources());

		sourceRootMap.clear();
		roots.forEach(v -> {
			sourceRootMap.put(v, new SourceRoute<>(this.analysisGraph, v));
		});

		List<SourceRoute<V, E>> originalSources = new ArrayList<>(
				sourceRootMap.values());

		// Track Metric Distance on Root Node
		sourceRootMap.put(virtualRoot.getRoot(), new SourceRoute<>(
				this.analysisGraph, virtualRoot.getRoot()));

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
				
				SpanningShortestPath<V, E> ssp = (forceNetwork && forcedTargets.contains(target)) ?
						closestRouteStrategy.createMetricSpanningShortestPath(target) :
						closestRouteStrategy.createSpanningShortestPath(target) ;
				
				targetMap.put(target, ssp);
			}
		}

		// Handle rejected Locations
		if (forcedTargets.size() > 0) {
			Map<V, SpanningShortestPath<V, E>> forcedMap = new HashMap<>();
			for (V v : forcedTargets) {
				forcedMap.put(v, targetMap.remove(v));
			}
			assemble(virtualRoot, forcedMap, sourceRootMap.keySet(),
					forceNetwork);
		}

		assemble(virtualRoot, targetMap, sourceRootMap.keySet(), forceNetwork);

		return originalSources;
	}

	protected SpanningShortestPath<V, E> createSpanningShortestPath(V source) {
		return closestRouteStrategy.createSpanningShortestPath(source);
	}

	private Collection<V> toFailedNodes(TreeMap<Double, V> treeMap) {
		return treeMap.descendingMap().values();
	}

	@SuppressWarnings("unchecked")
	private void assemble(VirtualRoot<V, E> virtualRoot,
			Map<V, SpanningShortestPath<V, E>> targetMap,
			Collection<V> previousPath, boolean force) throws FailedNetworkNode {

		// Track all Sources
		while (targetMap.size() > 0) {

			ClosestTarget closestSource = this.getClosestTarget(previousPath,
					targetMap);

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
			SourceRoute<V, E> sourceRoot = sourceRootMap.get(path
					.getEndVertex());

			// remove satisfied target
			targetMap.remove(path.getStartVertex());

			// Track Spanning Path
			sourceRoot.add(path);

			// Filters out all Empty Spanning Paths
			if (path.getEdgeList().size() == 0) {
				continue;
			}

			//
			List<V> pathList = path.getReverseVertexList();
			Iterator<V> itr = pathList.iterator();

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
					distanceToSource += metricEdgeWeight.getWeight(e);
				}

				// Keep Track of distance to source
				sourceRoot.add(next, distanceToSource);
				previous = next;
			}

			// Assign Previous Targets
			previousPath = pathList;
		}
	}

	private ClosestTarget getClosestTarget(Collection<V> deltaSources,
			Map<V, SpanningShortestPath<V, E>> targetMap) {

		ClosestTarget closestSource = new ClosestTarget();

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
				closestSource.addFailedTarget(
						ssp.getGraphPath().getWeight(metricEdgeWeight),
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

	private class ClosestTarget {

		private SpanningGraphPath<V, E> closestPath;
		private TreeMap<Double, V> failedTargets = null;

		public ClosestTarget() {
		}

		public ClosestTarget assignPath(SpanningGraphPath<V, E> path) {
			if (path.getEndVertex().equals(virtualRoot.getRoot())) {
				path = path.trimTarget();
			}

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

	// private static class ReverseIterator<T> implements Iterator<T> {
	//
	// private int index;
	// private List<T> list;
	//
	// public ReverseIterator(List<T> list) {
	// super();
	// this.list = list;
	// this.index = list.size() - 1;
	// }
	//
	// @Override
	// public boolean hasNext() {
	// return index >= 0;
	// }
	//
	// @Override
	// public T next() {
	// return list.get(index--);
	// }
	//
	// }

	private class UnconstrainedTargets extends SelectedTargets {
		private Collection<V> targets;

		public UnconstrainedTargets(Collection<V> targets) {
			this.targets = targets;
		}

		@Override
		public Collection<V> getTargets() {
			return targets;
		}
	}

	private class ConstrainedSelectedTargets extends SelectedTargets implements
			MetricDistance<V> {
		private V source;
		private GraphPathConstraint<V, E> pathPredicate;
		private WeightedGraph<V, E> graph;

		private ScalarClosestFirstSurfaceIterator<V, E> itr;
		private Map<V, Double> map = new HashMap<>();
		private Map<V, Double> rejected = new HashMap<>();
		private TreeMap<Double, V> failingVertices = new TreeMap<>();

		public ConstrainedSelectedTargets(V source,
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

//		@Override
//		public void forceFailures() {
//			findFurthestVertex(map.keySet());
//			V futhestVertex = findFurthestVertex(map.keySet());
//			failingVertices.put(getDistance(futhestVertex), futhestVertex);
//		}

		public Collection<V> getFailingVertices() {
			if (failingVertices.isEmpty()) {
				return failingVertices.values();
			}
			return Collections
					.singleton(failingVertices.lastEntry().getValue());
		}

		private V findFurthestVertex(Collection<V> vertices) {
			double max = 0;
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
			Double val = map.get(vertex);
			return val == null ? 0 : val;
		}

		private SpanningGraphPathImpl<V, E> createGraphPath(V endVertex,
				double pathLength) {
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

			return new SpanningGraphPathImpl<V, E>(graph, source, endVertex,
					edgeList, pathLength);

		}

		private void index(V vertex) {
			double pathLength = find(vertex);
			if (pathPredicate
					.isValid(this, createGraphPath(vertex, pathLength))) {
				map.put(vertex, pathLength);
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

	

	private abstract class SelectedTargets {

		public void addFailingTargets(Collection<V> vertices) {
		}

		public Collection<V> getFailingVertices() {
			return Collections.emptySet();
		}

		public Collection<V> getTargets() {
			throw new RuntimeException("Unsupported Operation");
		}		

	}

	private static final Logger log = LoggerFactory
			.getLogger(SpanningTreeAlgorithmImpl.class.getName());

}
