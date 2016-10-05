package com.altvil.aro.service.graph.alg;

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
import java.util.function.Predicate;
import java.util.stream.Collectors;

import org.jgrapht.GraphPath;
import org.jgrapht.Graphs;
import org.jgrapht.WeightedGraph;
import org.jgrapht.alg.DijkstraShortestPath;
import org.jgrapht.alg.FloydWarshallShortestPaths;
import org.jgrapht.graph.DefaultWeightedEdge;
import org.jgrapht.graph.GraphPathImpl;
import org.jgrapht.graph.SimpleWeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.GraphPathConstraint.MetricDistance;
import com.altvil.aro.service.graph.alg.stiener.FastAllShortestPaths;
import com.altvil.aro.service.graph.segment.GeoSegment;

@Deprecated
public class FastRouteBuilder<V, E extends AroEdge<GeoSegment>> {

	private static final Logger log = LoggerFactory
			.getLogger(RouteBuilder.class.getName());

	private WeightedGraph<V, E> sourceGraph;
	
	
	private FloydWarshallShortestPaths<V, E> allPaths;
	private GraphPathConstraint<V, E> pathPredicate = (sourceRoot, path) -> true;
	private Map<V, SourceRoute<V, E>> sourceRootMap = new HashMap<>();


	/* (non-Javadoc)
	 * @see com.altvil.aro.service.graph.alg.SpanningRouteBuilder#build(org.jgrapht.WeightedGraph, java.util.Collection, java.util.Collection)
	 */
	public Collection<SourceRoute<V, E>> build(WeightedGraph<V, E> source,
			Collection<V> all_roots, Collection<V> targets) {
		return build((sourceRoot, path) -> true, source, all_roots, targets);
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

	private Predicate<V> vertexPredicate(
			FloydWarshallShortestPaths<V, E> allPaths, Collection<V> allRoots,
			GraphPathConstraint<V, E> pathPredicate) {

		MetricDistance<V> md = (V) -> 0.0;

		return (target) -> {
			for (V source : allRoots) {
				if (pathPredicate.isValid(md,
						allPaths.getShortestPath(target, source))) {
					return true;
				}
			}

			log.error("Vertex Fails Network Constaint " + target);

			return false;
		};
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.graph.alg.SpanningRouteBuilder#build(com.altvil.aro.service.graph.alg.GraphPathConstraint, org.jgrapht.WeightedGraph, java.util.Collection, java.util.Collection)
	 */
	@SuppressWarnings("unchecked")
	public Collection<SourceRoute<V, E>> build(
			GraphPathConstraint<V, E> pathPredicate,
			WeightedGraph<V, E> sourceGraph, Collection<V> all_roots,
			Collection<V> targets) {

		this.sourceGraph = sourceGraph;
		this.pathPredicate = pathPredicate;
		this.allPaths = new FloydWarshallShortestPaths<V, E>(sourceGraph);

		// Filter out any vertices that fail Network Constraint
		// This will simplify network Algorithm as Precondition will be
		// satisfied that all vertices are Valid.
		//
		// This will also cause the network to fail Vertices Fast
		//
		targets = targets.stream()
				.filter(vertexPredicate(allPaths, targets, pathPredicate))
				.collect(Collectors.toList());

		// Track All Vertices that caused previous network generation to fail.
		List<V> failedNodes = new ArrayList<>();

		int maxCount = 10;
		int count = 1;
		while (count < maxCount) {
			try {
				return build(all_roots, targets, failedNodes, count == maxCount);
			} catch (FailedNetworkNode err) {
				log.info("Failed to route network plan .. rebuilding "
						+ err.getFailedNodes());
				failedNodes.add((V) err.getFailedNodes().iterator().next());
				count++;
			}
		}

		throw new RuntimeException("Failed to route network plan");

	}

	private Collection<SourceRoute<V, E>> build(Collection<V> all_roots,
			Collection<V> targets, Collection<V> forcedTargets,
			boolean forceNetwork) throws FailedNetworkNode {

		forcedTargets = new ArrayList<>(forcedTargets);

		// Establish Root Structures
		Set<V> roots = new HashSet<>(all_roots);

		sourceRootMap.clear();
		all_roots.forEach(v -> {
			sourceRootMap.put(v, new SourceRoute<>(sourceGraph, v));
		});

		List<SourceRoute<V, E>> originalSources = new ArrayList<>(
				sourceRootMap.values());

		// Reset Target
		Map<V, SpanningShortestPath<V, E>> targetMap = new HashMap<>(
				targets.size());
		for (V target : targets) {
			// Exclude any source target match

			if (roots.contains(target)) {
				// Update Root Structure
				// Distance still bound at 0
				sourceRootMap.get(target).add(
						new GraphPathImpl<V, E>(sourceGraph, target, target,
								new ArrayList<>(), 0.0));
			} else {
				targetMap.put(target, createSpanningShortestPath(target));
			}
		}

		// Handle rejected Locations
		if (forcedTargets.size() > 0) {
			Map<V, SpanningShortestPath<V, E>> forcedMap = new HashMap<>();
			for (V v : forcedTargets) {
				forcedMap.put(v, forcedMap.remove(v));
			}
			assemble(forcedMap, forceNetwork);
		}

		assemble(targetMap, forceNetwork);

		return originalSources;
	}
	
	
	protected  SpanningShortestPath<V, E> createSpanningShortestPath(V source) {
		return new FastAllShortestPaths<V, E>(source,
				allPaths) ;
	}

	private Collection<V> toFailedNodes(TreeMap<Double, V> treeMap) {
		return treeMap.descendingMap().values();
	}

	@SuppressWarnings("unchecked")
	private void assemble(Map<V, SpanningShortestPath<V, E>> targetMap,
			boolean force) throws FailedNetworkNode {

		// Track all Sources
		while (targetMap.size() > 0) {

			ClosestSource<V, E> closestSource = this.getClosestSource(
					sourceRootMap.keySet(), targetMap);

			// Evil Boundary Condition
			// Caused by failure to connect Path OR Invalid Path
			if (!closestSource.isValidPath()) {
				if (closestSource.hasFailedTargets()) {
					throw new FailedNetworkNode(
							(Collection<Object>) toFailedNodes(closestSource
									.getFailedTargets()));
				}
			}

			GraphPath<V, E> path = closestSource.getClosestPath();

			// Bind Root
			SourceRoute<V, E> sourceRoot = sourceRootMap.get(path
					.getEndVertex());

			// Filters out all 0 length routes
			if (path.getEdgeList().size() == 0) {
				// Update Root
				sourceRoot.add(path);
				targetMap.remove(path.getStartVertex());
				continue;
			}

			targetMap.remove(path.getStartVertex());
			sourceRoot.add(path);

			List<V> pathList = Graphs.getPathVertexList(path);
			Iterator<V> itr = new ReverseIterator<V>(pathList);

			V endVertex = itr.next();

			double distanceToSource = sourceRoot.getDistance(endVertex);

			V previous = endVertex;

			// This will not update the target Vertex as already assigned
			while (itr.hasNext()) {
				V next = itr.next();

				// Update the vertex as bound with Source
				sourceRootMap.put(next, sourceRoot);

				E e = sourceGraph.getEdge(previous, next);
				// TODO remove this condition
				if (e != null) {
					distanceToSource += e.getValue().getLength();
				}

				// Keep Track of distance to source
				sourceRoot.add(next, distanceToSource);
				previous = next;
			}
		}

	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.graph.alg.SpanningRouteBuilder#buildSourceRoute(com.altvil.aro.service.graph.alg.GraphPathConstraint, org.jgrapht.WeightedGraph, V, java.util.Collection)
	 */
	public SourceRoute<V, E> buildSourceRoute(
			GraphPathConstraint<V, E> pathPredicate,
			WeightedGraph<V, E> source, V root, Collection<V> targets) {
		return build(pathPredicate, source, Collections.singleton(root),
				targets).iterator().next();
	}

	private ClosestSource<V, E> getClosestSource(Set<V> sources,
			Map<V, SpanningShortestPath<V, E>> targetMap) {

		GraphPath<V, E> shortedPath = null;
		double shortestPathLength = Double.MAX_VALUE;
		ClosestSource<V, E> closestSource = new ClosestSource<>();

		for (V target : targetMap.keySet()) {
			SpanningShortestPath<V, E> paths = targetMap.get(target);

			V source = paths.findClosestTarget(sources);

			if (source != null) {
				double sourceWeight = paths.getWeight(source);

				if (sourceWeight < shortestPathLength) {
					GraphPath<V, E> path = paths.getGraphPath(source);
					if (isValidPath(path)) {
						shortedPath = paths.getGraphPath(source);
						shortestPathLength = sourceWeight;
					} else {
						closestSource.addFailedTarget(shortestPathLength,
								target);
					}
				}
			}
		}

		return closestSource.assignPath(shortedPath);
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

	private static class ClosestSource<V, E extends AroEdge<GeoSegment>> {

		private GraphPath<V, E> closestPath;
		private TreeMap<Double, V> failedTargets = null;

		public ClosestSource() {
		}

		public ClosestSource<V, E> assignPath(GraphPath<V, E> path) {
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

		public GraphPath<V, E> getClosestPath() {
			return closestPath;
		}

	}

	private static class ReverseIterator<T> implements Iterator<T> {

		private int index;
		private List<T> list;

		public ReverseIterator(List<T> list) {
			super();
			this.list = list;
			this.index = list.size() - 1;
		}

		@Override
		public boolean hasNext() {
			return index >= 0;
		}

		@Override
		public T next() {
			return list.get(index--);
		}

	}

}
