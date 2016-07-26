package com.altvil.aro.service.graph.alg;

import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.google.common.collect.TreeMultimap;

import org.jgrapht.GraphPath;
import org.jgrapht.Graphs;
import org.jgrapht.WeightedGraph;
import org.jgrapht.graph.GraphPathImpl;

import java.util.*;

public class AllShortestPaths<V, E> {

	private V source;
	private WeightedGraph<V, E> graph;
	private boolean reversed = false;

	private Set<V> seenVertices = new HashSet<>();
	private ClosestFirstSurfaceIterator<V, E> itr;

	private Set<V> currentTargets;
	
	private static  <V,E> ClosestFirstSurfaceIterator<V, E>  createItr(WeightedGraph<V, E> graph, V source) {
		 return new ScalarClosestFirstSurfaceIterator<>(graph, source) ;
	}
	
	public AllShortestPaths(WeightedGraph<V, E> graph,
			ClosestFirstSurfaceIterator<V, E> itr, V source) {
		this.graph = graph;
		this.source = source;
		this.seenVertices = new HashSet<>();
		this.itr = itr;
	}
	
	public AllShortestPaths(WeightedGraph<V, E> graph,
			ClosestFirstSurfaceBuilder<V, E> closestFirstSurfaceBuilder, V source) {
		this(graph, closestFirstSurfaceBuilder.build(graph, source), source) ;
	}
	
	
	public AllShortestPaths(WeightedGraph<V, E> graph, V source) {
		this(graph, createItr(graph, source), source) ;
	}
	
	public TreeMultimap<Double, V> findPaths(Collection<V> targets) {
		TreeMultimap<Double, V> lengthToPath = TreeMultimap.create(Double::compare, (o1, o2) -> Integer.compare(o1.hashCode(), o2.hashCode()));
		currentTargets = new HashSet<>(targets);

		int count = 0 ;
		
		for (V target : targets) {
			if (seenVertices.contains(target)) {
				count++ ;
				lengthToPath.put(itr.getShortestPathLength(target), target);
				currentTargets.remove(target);
			}
		}

		while (itr.hasNext()) {
			
			if( currentTargets.size() == 0 ) {
				break ;
			}
			
			V n = itr.next();
			seenVertices.add(n);
			if (currentTargets.remove(n)) {
				count++ ;
				lengthToPath.put(itr.getShortestPathLength(n), n);
			}
		}

		if (lengthToPath.size() != count) {
			throw new RuntimeException("TreeMap") ;
		}

		return lengthToPath;
	}

	public Collection<V> findPathVertices(Collection<V> targets) {

		List<V> result = new ArrayList<>();
		currentTargets = new HashSet<>(targets);

		for (V target : targets) {
			if (seenVertices.contains(target)) {
				result.add(target);
				currentTargets.remove(target);
			}
		}

		while (itr.hasNext()) {
			
			if( currentTargets.size() == 0 ) {
				break ;
			}
			
			V n = itr.next();
			
			//System.out.println("seen " + n);
			
			seenVertices.add(n);
			if (currentTargets.remove(n)) {
				//System.out.println("recorded " + n);
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
		return itr.getShortestPathLength(vertex) ;
	}

	public E getSpanningTreeEdge(V target) {
		return itr.getSpanningTreeEdge(target);
	}
}
