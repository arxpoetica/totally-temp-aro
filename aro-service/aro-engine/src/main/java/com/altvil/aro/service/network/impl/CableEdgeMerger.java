package com.altvil.aro.service.network.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.CableConstructionEnum;

public class CableEdgeMerger {

	public Collection<CableConduitEdge> merge(Collection<CableConduitEdge> edges) {
		Map<Long, List<CableConduitEdge>> map = edges.stream().collect(
				Collectors.groupingBy(CableConduitEdge::getEdgeId));

		return null;
	}
	
	
	private List<CableConduitEdge> mergeRoadEdge(List<CableConduitEdge> constructionEdges) {
		
		if(constructionEdges.size() <= 1 ) {
			return constructionEdges ;
		}
		
		Map<CableConstructionEnum, List<CableConduitEdge>> map  = constructionEdges.stream().collect(Collectors.groupingBy(CableConduitEdge::getCableConstructionEnum)) ;
		
		if( map.size() == 1 ) {
			return constructionEdges ;
		}
		
		
		List<CableConstructionEnum> constructionTypes = new ArrayList<>() ;
		constructionTypes.addAll(map.keySet()) ;
		Collections.sort(constructionTypes);
		
		
		
		return null ;
	}
	

	public static class EdgeSelection {
		
		private TreeMap<Double, CableConduitEdge> edgeMap ;
		private  List<CableConduitEdge> selectedSegments ;
		
		
		public void remove(List<CableConduitEdge> selectedSegments) {
			
		}
		
		public void update(CableConduitEdge edge) {
		
			if( selectedSegments.size() == 0 ){
				edgeMap.put(edge.getStartRatio(), edge) ;
			}
		}
		
	}
	
	
	private static class OrderedConstructionEdges {
		private TreeMap<Double, CableConduitEdge> edgeMap = new TreeMap<>() ;
		
		
		
		
		public void removeRange(double startInc, double endExc) {
			
		}
		
		
	}

}
