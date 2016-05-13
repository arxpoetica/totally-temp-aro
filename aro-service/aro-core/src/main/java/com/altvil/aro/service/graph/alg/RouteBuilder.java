package com.altvil.aro.service.graph.alg;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.google.common.collect.TreeMultimap;

import org.jgrapht.GraphPath;
import org.jgrapht.Graphs;
import org.jgrapht.WeightedGraph;
import org.jgrapht.alg.DijkstraShortestPath;
import org.jgrapht.graph.DefaultWeightedEdge;
import org.jgrapht.graph.SimpleWeightedGraph;

import java.util.*;

public class RouteBuilder<V, E extends AroEdge<GeoSegment>> {

	private Map<V, AllShortestPaths<V, E>> targetMap;

	public Collection<SourceRoute<V,E>> build(WeightedGraph<V, E> source, ClosestFirstSurfaceBuilder<V, E> builder, Collection<V> all_roots,
			Collection<V> targets) {
		
		
		//Establish Root Structures
		Set<V> roots = new HashSet<>(all_roots) ;
		
		Map<V, SourceRoute<V, E>> sourceRootMap = new HashMap<>() ;
		all_roots.forEach(v -> {
			sourceRootMap.put(v, new SourceRoute<>(v)) ;
		});
		
		List<SourceRoute<V, E>> originalSources = new ArrayList<>(sourceRootMap.values()) ;
		
		targetMap = new HashMap<>(targets.size());
		for (V target : targets) {
			// Exclude any source target match

			if (roots.contains(target)) {
				//Update Root Structure
				sourceRootMap.get(target).add(target, target, new HashSet<E>());
			} else {
				targetMap.put(target,
						new AllShortestPaths<V, E>(source, builder, target));
			}
		}

		//Set<V> sources = new HashSet<>();

		// Track all Sources
		//sources.addAll(roots);

		while (targetMap.size() > 0) {

			GraphPath<V, E> path = this.getClosestSource(sourceRootMap.keySet());
			//Evil Boundary Condition
			if( path == null ) {
				break ;
			}
			//Bind Root
			SourceRoute<V, E> sourceRoot = sourceRootMap.get(path.getEndVertex());
			
			// Filters out all 0 length routes
			if (path.getEdgeList().size() == 0) {
				//Update Root
				sourceRoot.add(path.getStartVertex(), path
						.getStartVertex(), new HashSet<E>());
				targetMap.remove(path.getStartVertex());
				continue;
			}

			List<V> pathList = Graphs.getPathVertexList(path);
			Iterator<V> itr = pathList.iterator();

			V startVertex = itr.next();
			V previous = startVertex;

			targetMap.remove(previous);
			sourceRootMap.put(previous, sourceRoot) ;
			
			Set<E> resultPath = new HashSet<>(pathList.size());
			while (itr.hasNext()) {
				V next = itr.next();
				//sources.add(next);
				sourceRootMap.put(next, sourceRoot) ;
				E e = source.getEdge(previous, next);

				previous = next;

				if (e != null) {
					resultPath.add(e);
				}
			}
			
			sourceRoot.add(startVertex, previous, resultPath);
			targetMap.remove(path.getStartVertex());

		}

		return originalSources  ;
	}

	// Return a composite Result
	public Set<E> build(WeightedGraph<V, E> source, ClosestFirstSurfaceBuilder<V, E> closestFirstBuilder, V root,
			Collection<V> targets) {

		targetMap = new HashMap<>(targets.size());
		for (V target : targets) {
			// Exclude any source target match
			if (!target.equals(root)) {
				targetMap.put(target,
						new AllShortestPaths<V, E>(source, closestFirstBuilder.build(source, target), target));
			}
		}

		Set<E> edges = new HashSet<>();
		Set<V> sources = new HashSet<>();

		// Track all Sources
		sources.add(root);

		while (targetMap.size() > 0) {
			GraphPath<V, E> path = this.getClosestSource(sources);
			//Evil Boundary Condition
			if( path == null ) {
				break ;
			}

			// Filters out all 0 length routes
			if (path.getEdgeList().size() == 0) {
				targetMap.remove(path.getStartVertex());
				continue;
			}

			List<V> pathList = Graphs.getPathVertexList(path);
			Iterator<V> itr = pathList.iterator();

			V previous = itr.next();
			targetMap.remove(previous);
			sources.add(previous);
			while (itr.hasNext()) {
				V next = itr.next();
				sources.add(next);
				E e = source.getEdge(previous, next);

				previous = next;

				if (e != null) {
					edges.add(e);
				}
			}

			targetMap.remove(path.getStartVertex());

		}

		return edges;
	}

	private GraphPath<V, E> getClosestSource(Set<V> sources) {
		TreeMap<Double, GraphPath<V, E>> treeMap = new TreeMap<>();
		for (V target : targetMap.keySet()) {
			AllShortestPaths<V, E> paths = targetMap.get(target);
			TreeMultimap<Double, V> tm = paths.findPaths(sources);

			Set<Map.Entry<Double, V>> entries = tm.entries();
			if (!entries.isEmpty()) {
				Map.Entry<Double, V> entry = entries.iterator().next();
				GraphPath<V, E> path = paths.getGraphPath(entry.getValue());
				treeMap.put(path.getWeight(), path);
			}
		}
		return treeMap.size() == 0 ? null : treeMap.firstEntry().getValue();

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

			// System.out.println(start + "->" + end);

			g.addVertex(start);
			g.addVertex(end);

			DefaultWeightedEdge e = g.addEdge(start, end);
			if (e == null) {

			} else {
				g.setEdgeWeight(e, w);
				// System.out.println("Duplicated Validated Edge " + start +
				// "->" + end) ;
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

}
