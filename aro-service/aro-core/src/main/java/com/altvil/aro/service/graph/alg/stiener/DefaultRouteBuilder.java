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
import com.altvil.aro.service.graph.alg.SourceRoute;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class DefaultRouteBuilder<V, E extends AroEdge<GeoSegment>> implements
		SpanningRouteBuilder<V, E> {

	// private static final Logger log = LoggerFactory
	// .getLogger(AbstractRouteBuilder.class.getName());

	private ClosestRouteStrategy<V, E> closestRouteStrategy;
	private WeightedGraph<V, E> sourceGraph;
	private GraphPathConstraint<V, E> pathPredicate = (sourceRoot, path) -> true;
	private Collection<V> allRoots;
	private Collection<V> assignedTargets;

	private Map<V, SourceRoute<V, E>> sourceRootMap = new HashMap<>();

	public DefaultRouteBuilder(ClosestRouteStrategy<V, E> closestRouteStrategy,
			WeightedGraph<V, E> sourceGraph,
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

		try (VirtualRoot vr = createVirtualRoot(sourceGraph, allRoots)) {
			return this.build(vr, assignedTargets);
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
			Collection<V> targets) {

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
				return build(virtualRoot, targets,
						count == maxCount);
			} catch (FailedNetworkNode err) {
				log.info("Failed to route network plan .. rebuilding "
						+ err.getFailedNodes());
				virtualRoot.addRejectedTarget((V) err.getFailedNodes().iterator().next());
				count++;
			}
		}

		throw new RuntimeException("Failed to route network plan");

	}

	private Collection<SourceRoute<V, E>> build(VirtualRoot virtualRoot,
			Collection<V> targets,
			boolean forceNetwork) throws FailedNetworkNode {

		 Collection<V> forcedTargets = new ArrayList<>(virtualRoot.getForcedTargets());

		// Establish Root Structures
		Set<V> roots = new HashSet<>(virtualRoot.getConnectedRoots());

		sourceRootMap.clear();
		roots.forEach(v -> {
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
				SpanningShortestPath<V, E> ssp = createSpanningShortestPath(target);
				ssp.seedOrigin(virtualRoot.getRoot());
				targetMap.put(target, ssp);
			}
		}

		// Handle rejected Locations
		if (forcedTargets.size() > 0) {
			Map<V, SpanningShortestPath<V, E>> forcedMap = new HashMap<>();
			for (V v : forcedTargets) {
				forcedMap.put(v, targetMap.remove(v));
			}
			assemble(forcedMap, forceNetwork);
		}

		assemble(targetMap, forceNetwork);

		return originalSources;
	}

	protected SpanningShortestPath<V, E> createSpanningShortestPath(V source) {
		return closestRouteStrategy.createSpanningShortestPath(source);
	}

	private Collection<V> toFailedNodes(TreeMap<Double, V> treeMap) {
		return treeMap.descendingMap().values();
	}

	@SuppressWarnings("unchecked")
	private void assemble(Map<V, SpanningShortestPath<V, E>> targetMap,
			boolean force) throws FailedNetworkNode {

		
		Collection<V> previousTargets = Collections.emptyList() ;
		
		// Track all Sources
		while (targetMap.size() > 0) {

			ClosestTarget<V, E> closestSource = this.getClosestSource(
					previousTargets, targetMap);

			// Evil Boundary Condition
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

			GraphPath<V, E> path = closestSource.getClosestPath();

			// Bind Root
			SourceRoute<V, E> sourceRoot = sourceRootMap.get(path
					.getEndVertex());

			// Filters out all Null Set Roots (Note Vert
			if (path.getEdgeList().size() == 1) {
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
			
			//Assign Previous Targets
			previousTargets = pathList ;
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
			GraphPath<V, E> path = ssp.getGraphPath();
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

		private GraphPath<V, E> closestPath;
		private TreeMap<Double, V> failedTargets = null;

		public ClosestTarget() {
		}

		public ClosestTarget<V, E> assignPath(GraphPath<V, E> path) {
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

	private VirtualRoot createVirtualRoot(WeightedGraph<V, E> graph,
			Collection<V> sources) {
		return null;
	}

	private class VirtualRoot implements Closeable {
		private V root;
		private Collection<V> connectedRoots;

		public V getRoot() {
			return root;
		}
		
		public Collection<V> getForcedTargets() {
			return null ;
		}
		
		public void addRejectedTarget(V rejectedTarget) {
			
		}

		public Collection<V> getConnectedRoots() {
			return connectedRoots;
		}

		@Override
		public void close() throws IOException {
			// TODO Auto-generated method stub

		}

	}

	private static final Logger log = LoggerFactory
			.getLogger(DefaultRouteBuilder.class.getName());

}
