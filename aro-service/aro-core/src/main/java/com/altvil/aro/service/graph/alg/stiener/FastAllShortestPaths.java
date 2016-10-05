package com.altvil.aro.service.graph.alg.stiener;

import java.util.ArrayList;
import java.util.Collection;
import java.util.TreeMap;

import org.jgrapht.GraphPath;
import org.jgrapht.alg.FloydWarshallShortestPaths;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;

public class FastAllShortestPaths<V, E extends AroEdge<?>> implements SpanningShortestPath<V, E> {

	private V source;
	private FloydWarshallShortestPaths<V, E> allShortestPaths;
	//private TreeMap<V,E> treeMap ;
	

	public FastAllShortestPaths(V source,
			FloydWarshallShortestPaths<V, E> allShortestPaths) {
		super();
		this.source = source;
		this.allShortestPaths = allShortestPaths;
	}


	/* (non-Javadoc)
	 * @see com.altvil.aro.service.graph.alg.SpanningShortestPath#findClosestTarget(java.util.Collection)
	 */
	@Override
	public V findClosestTarget(Collection<V> targets) {
		double shortestLength = Double.MAX_VALUE;
		V closestTarget = null;

		for (V target : targets) {
			double distance = allShortestPaths.shortestDistance(source, target);
			if (distance < shortestLength) {
				shortestLength = distance;
				closestTarget = target;
			}
		}
		

		return closestTarget ;
	}
	
	/* (non-Javadoc)
	 * @see com.altvil.aro.service.graph.alg.SpanningShortestPath#getClosestTargets(java.util.Collection)
	 */
	public Collection<V> getClosestTargets(Collection<V> targets) {
		TreeMap<Double, V> treeMap = new TreeMap<>() ;
		
		for (V target : targets) {
			double distance = allShortestPaths.shortestDistance(source, target);
			treeMap.put(distance, target) ;
		}
	
		return new ArrayList<>(treeMap.values()) ;
		
	}
	

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.graph.alg.SpanningShortestPath#getGraphPath(V)
	 */
	@Override
	public GraphPath<V, E> getGraphPath(V endVertex) {
		return allShortestPaths.getShortestPath(source, endVertex) ;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.graph.alg.SpanningShortestPath#getWeight(V)
	 */
	@Override
	public double getWeight(V vertex) {
		return allShortestPaths.shortestDistance(source, vertex) ;
	}


}
