package com.altvil.aro.service.graph.alg.stiener;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.jgrapht.Graph;
import org.jgrapht.GraphPath;
import org.jgrapht.Graphs;
import org.jgrapht.graph.GraphPathImpl;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;

public class DijkastraShortestPath <V, E extends AroEdge<?>> implements SpanningShortestPath<V, E>{

	private ScalarClosestFirstSurfaceIterator<V,E> itr ;
	
	private Graph<V,E> graph ;
	private V source ;
	
	private V currentTarget ;
	private double currentWeight ;
	
	private double find(V vertex) {
		if( !itr.isSeenVertex(vertex) ) {
			while( itr.hasNext() && !(itr.next() == vertex) ) {
			}
		}
		
		return itr.getShortestPathLength(vertex) ;
	}
	
	@Override
	public double seedOrigin(V origin) {
		currentTarget = origin ;
		currentWeight = find(origin) ;
		 return currentWeight ;
	}

	@Override
	public double updateNetworkPath(Collection<V> vertices) {
		
		for(V v : vertices) {
			double weight = find(v) ;
			if( weight < currentWeight ) {
				currentWeight = weight ;
				currentTarget = v; 
			}
		}
		
		return currentWeight ;
	}

	@Override
	public GraphPath<V, E> getGraphPath() {
		List<E> edgeList = new ArrayList<E>();

		V v = currentTarget;

		while (true) {
			E edge = itr.getSpanningTreeEdge(v);

			if (edge == null) {
				break;
			}

			edgeList.add(edge);
			v = Graphs.getOppositeVertex(graph, edge, v);
		}

		if (true) {
			Collections.reverse(edgeList);
		}
		double pathLength = itr.getShortestPathLength(currentTarget);

		return new GraphPathImpl<V, E>(graph, currentTarget, source, edgeList,
				pathLength);
	}

	@Override
	public double getWeight() {
		return currentWeight ;
	}

}
