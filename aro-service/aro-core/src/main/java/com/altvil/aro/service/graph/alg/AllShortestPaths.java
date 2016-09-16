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

import org.jgrapht.GraphPath;
import org.jgrapht.Graphs;
import org.jgrapht.WeightedGraph;
import org.jgrapht.graph.GraphPathImpl;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.google.common.collect.TreeMultimap;

public class AllShortestPaths<V, E extends AroEdge<?>> {

	private V source;
	private WeightedGraph<V, E> graph;
	private boolean reversed = false;
	private ClosestTargetItr targetItr = null;

	private final Map<V, Double> pathLengthForSeenVertex = new HashMap<>();
	private final ClosestFirstSurfaceIterator<V, E> itr;

	public AllShortestPaths(WeightedGraph<V, E> graph,
			ClosestFirstSurfaceBuilder closestFirstSurfaceBuilder, V source) {
		this.graph = graph;
		this.source = source;
		this.itr = closestFirstSurfaceBuilder.build(graph, source);
	}

	public TreeMultimap<Double, V> findPaths(Collection<V> targets) {
		TreeMultimap<Double, V> lengthToPath = TreeMultimap.create(
				Double::compare,
				(o1, o2) -> Integer.compare(o1.hashCode(), o2.hashCode()));
		Set<V> currentTargets = new HashSet<>(targets);

		int count = 0;

		for (V target : targets) {
			Double distance = pathLengthForSeenVertex.get(target);
			if (distance != null) {
				count++;
				lengthToPath.put(distance, target);
				currentTargets.remove(target);
			}
		}

		while (itr.hasNext()) {

			if (currentTargets.size() == 0) {
				break;
			}

			final V n = itr.next();
			final double shortestPathLength = itr.getShortestPathLength(n);
			pathLengthForSeenVertex.put(n, shortestPathLength);
			if (currentTargets.remove(n)) {
				count++;
				lengthToPath.put(shortestPathLength, n);
			}
		}

		if (lengthToPath.size() != count) {
			throw new RuntimeException("TreeMap");
		}

		return lengthToPath;
	}

	private enum TargetState {
		KNOWN, UNKNOWN
	}

	public class ClosestTargetItr {

		private Collection<V> targets;

		private List<V> knownTargets = new ArrayList<>();
		private TreeMap<Double, V> treeMap = new TreeMap<>();
		private TargetState targetState = TargetState.KNOWN;
		private int index = 0;

		public ClosestTargetItr() {
			super();
		}

		public ClosestTargetItr setTargets(Collection<V> targets) {
			
			this.targets = targets ;
			knownTargets.clear();
			treeMap.clear();
			index = 0;
			knownTargets = orderKnown();
	
			return this;
		}

		public V next() {

			switch (targetState) {

			case KNOWN:
				if (index < knownTargets.size()) {
					return knownTargets.get(index++);
				}
				targetState = TargetState.UNKNOWN;
				return next();
			case UNKNOWN:
			default:
				return nextUnknown();
			}

		}

		private List<V> orderKnown() {
		
			for (V target : targets) {
				Double distance = pathLengthForSeenVertex.get(target);
				if (distance != null) {
					treeMap.put(distance, target);
				}
			}

			knownTargets.addAll(treeMap.values());
			return knownTargets;
		}

		private V nextUnknown() {
			while (itr.hasNext()) {
				V n = itr.next();
				final double shortestPathLength = itr.getShortestPathLength(n);
				pathLengthForSeenVertex.put(n, shortestPathLength);

				if (targets.contains(n)) {
					return n;
				}
			}

			return null;
		}

	}

	public ClosestTargetItr getClosestTargetItr(Collection<V> targets) {

		if (targetItr == null) {
			targetItr = new ClosestTargetItr();
		}

		return targetItr.setTargets(targets);
	}

	public V findClosestTarget(Collection<V> targets) {
		double shortestLength = Double.MAX_VALUE;
		V closestTarget = null;

		for (V target : targets) {
			Double distance = pathLengthForSeenVertex.get(target);

			if (distance != null) {
				if (distance < shortestLength) {
					shortestLength = distance;
					closestTarget = target;
				}
			}
		}

		if (closestTarget != null) {
			return closestTarget;
		}

		while (itr.hasNext()) {
			V n = itr.next();

			final double shortestPathLength = itr.getShortestPathLength(n);
			pathLengthForSeenVertex.put(n, shortestPathLength);

			if (targets.contains(n)) {
				return n;
			}
		}

		return null;
	}

	public Collection<V> findPathVertices(Collection<V> targets) {

		List<V> result = new ArrayList<>();
		Set<V> currentTargets = new HashSet<>(targets);

		for (V target : targets) {
			if (pathLengthForSeenVertex.containsKey(target)) {
				result.add(target);
				currentTargets.remove(target);
			}
		}

		while (itr.hasNext()) {

			if (currentTargets.size() == 0) {
				break;
			}

			V n = itr.next();

			final double shortestPathLength = itr.getShortestPathLength(n);
			pathLengthForSeenVertex.put(n, shortestPathLength);
			if (currentTargets.remove(n)) {
				result.add(n);
			}
		}
		return result;
	}

	public GraphPath<V, E> getGraphPath(V endVertex) {
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

		if (!reversed) {
			Collections.reverse(edgeList);
		}
		double pathLength = itr.getShortestPathLength(endVertex);

		return new GraphPathImpl<V, E>(graph, source, endVertex, edgeList,
				pathLength);
	}

	public double getWeight(V vertex) {
		Double distance = pathLengthForSeenVertex.get(vertex);

		while (distance == null && itr.hasNext()) {
			V n = itr.next();

			final double shortestPathLength = itr.getShortestPathLength(n);
			pathLengthForSeenVertex.put(n, shortestPathLength);

			if (n.equals(vertex)) {
				distance = shortestPathLength;
			}
		}

		return distance == null ? Double.POSITIVE_INFINITY : distance;
	}

	public E getSpanningTreeEdge(V target) {
		return itr.getSpanningTreeEdge(target);
	}
}
