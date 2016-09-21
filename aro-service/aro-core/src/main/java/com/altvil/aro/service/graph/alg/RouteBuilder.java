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
import com.altvil.aro.service.graph.alg.AllShortestPaths.ClosestTargetItr;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class RouteBuilder<V, E extends AroEdge<GeoSegment>> {

	private static final Logger log = LoggerFactory
			.getLogger(RouteBuilder.class.getName());

	private Map<V, SourceRoute<V, E>> sourceRootMap = new HashMap<>();
	
	private Map<V, AllShortestPaths<V, E>> targetMap;

	private GraphPathConstraint<V, E> pathPredicate = (sourceRoot, path) -> true ;

	public Collection<SourceRoute<V, E>> build(WeightedGraph<V, E> source,
			Collection<V> all_roots, Collection<V> targets) {
		
		return build((sourceRoot, path) -> true, source, all_roots, targets) ;
	}
	
	
	public Collection<SourceRoute<V, E>> build(GraphPathConstraint<V, E> pathPredicate, WeightedGraph<V, E> source,
			Collection<V> all_roots, Collection<V> targets) {
		
		this.pathPredicate = pathPredicate ;
		
		if( log.isDebugEnabled() ) {
			for(V v : targets) {
				if( !source.containsVertex(v) ) {
					throw new RuntimeException("Vertex not defined in graph " + v) ;
				}
			}
		}
		
		
		// Establish Root Structures
		Set<V> roots = new HashSet<>(all_roots);

		all_roots.forEach(v -> {
			sourceRootMap.put(v, new SourceRoute<>(source, v));
		});

		List<SourceRoute<V, E>> originalSources = new ArrayList<>(
				sourceRootMap.values());

		targetMap = new HashMap<>(targets.size());
		for (V target : targets) {
			// Exclude any source target match

			if (roots.contains(target)) {
				// Update Root Structure
				//Distance still bound at 0
				sourceRootMap.get(target).add(new GraphPathImpl<V, E>(source, target, target, new ArrayList<>(), 0.0));
			} else {
				targetMap.put(target,
						new AllShortestPaths<V, E>(source, ScalarClosestFirstSurfaceIterator.BUILDER, target));
			}
		}

		
		// Track all Sources
		while (targetMap.size() > 0) {

			GraphPath<V, E> path = this
					.getClosestSource(sourceRootMap.keySet());
			
			// Evil Boundary Condition
			if (path == null) {
				break;
			}
			
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
			Iterator<V> itr = new ReverseIterator<V>(pathList) ;
			
			V endVertex = itr.next();
			
			//sourceRootMap.put(, sourceRoot);
			
			double distanceToSource = sourceRoot.getDistance(endVertex) ;
			
			V previous = endVertex;

			//This will not update the target Vertex as already assigned
			while (itr.hasNext()) {
				V next = itr.next();
				
				//Update the vertex as bound with Source
				sourceRootMap.put(next, sourceRoot);
				
				
				E e = source.getEdge(previous, next);
				//TODO remove this condition
				if (e != null) {
					distanceToSource += e.getValue().getLength() ;
				}

				//Keep Track of distance to source
				sourceRoot.add(next, distanceToSource) ;
				previous = next;
			}

			

		}

		return originalSources;
	}

	public SourceRoute<V, E> buildSourceRoute(GraphPathConstraint<V, E> pathPredicate, WeightedGraph<V, E> source,
			V root, Collection<V> targets) {
		return build(pathPredicate, source, Collections.singleton(root), targets).iterator()
				.next();
	}

	// Return a composite Result

	public Set<E> build(WeightedGraph<V, E> source,
			ClosestFirstSurfaceBuilder closestFirstBuilder, V root,
			Collection<V> targets) {

		targetMap = new HashMap<>(targets.size());
		for (V target : targets) {
			// Exclude any source target match
			if (target != null && !target.equals(root)) {
				targetMap.put(target, new AllShortestPaths<V, E>(source,
						closestFirstBuilder, target));
			}
		}

		Set<E> edges = new HashSet<>();
		Set<V> sources = new HashSet<>();

		// Track all Sources
		sources.add(root);

		while (targetMap.size() > 0) {
			GraphPath<V, E> path = this.getClosestSource(sources);
			// Evil Boundary Condition
			if (path == null) {
				break;
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
		double shortestPathLength = Double.MAX_VALUE;
		GraphPath<V, E> shortedPath = null;
		
		for (V target : targetMap.keySet()) {
			AllShortestPaths<V, E> paths = targetMap.get(target);
			V source = paths.findClosestTarget(sources);

			if (source != null) {
				 double sourceWeight = paths.getWeight(source);
				
				if (sourceWeight < shortestPathLength) {
					GraphPath<V, E> path = paths.getGraphPath(source);
					
					if (isValidPath(path)) {
						shortedPath = paths.getGraphPath(source);
						shortestPathLength = sourceWeight;
					} else {
						//Still need to try and find a shortest Path
						if( shortedPath == null ) {
							ClosestTargetItr targetItr = paths.getClosestTargetItr(sources) ;
							source = null ;
							while((source= (V) targetItr.next()) !=null) {
								path = paths.getGraphPath(source);
								if (isValidPath(path)) {
									shortedPath = path;
									shortestPathLength = paths.getWeight(source) ;
									break ;
								}
							}
						}
					}

				}
			}
		}
		
		return shortedPath ;
	}

//	private GraphPath<V, E> getClosestSource(Set<V> sources) {
//		TreeMap<Double, GraphPath<V, E>> treeMap = new TreeMap<>();
//		for (V target : targetMap.keySet()) {
//			AllShortestPaths<V, E> paths = targetMap.get(target);
//			TreeMultimap<Double, V> tm = paths.findPaths(sources);
//
//			Set<Map.Entry<Double, V>> entries = tm.entries();
//			if (!entries.isEmpty()) {
//				for(Map.Entry<Double, V> entry : entries) {
//					GraphPath<V, E> path = paths.getGraphPath(entry.getValue());
//					if( isValidPath(path) ) {
//						treeMap.put(path.getWeight(), path);
//						break ;
//					}
//				}
//			}
//		}
//		
//		if( treeMap.isEmpty() ) {
//			return null ;
//		}
//		
//		return treeMap.values().iterator().next() ;
//		
//	}
	
	private boolean isValidPath(GraphPath<V, E> path) {
		return pathPredicate.isValid(sourceRootMap.get(path.getEndVertex()), path) ;
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
	
	private static class ReverseIterator<T> implements Iterator<T> {

		private int index ;
		private List<T> list ;
		
		public ReverseIterator(List<T> list) {
			super();
			this.list = list;
			this.index = list.size()-1 ;
		}

		@Override
		public boolean hasNext() {
			return index>= 0 ;
		}

		@Override
		public T next() {
			return list.get(index--) ;
		}
		
	}

}
