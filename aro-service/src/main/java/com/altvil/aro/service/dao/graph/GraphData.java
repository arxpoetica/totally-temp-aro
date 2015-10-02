package com.altvil.aro.service.dao.graph;

import java.util.Collection;

public class GraphData {

	public static class Builder {
		
		private GraphData graphData = new GraphData() ;
		
		public Builder setEdges(Collection<GraphEdge> graphEdges) {
			graphData.graphEdges = graphEdges ;
			return this ;
		}
		
		public Builder setVertices(Collection<GraphVertex> graphVertices) {
			graphData.graphVertices = graphVertices ;
			return this ;
		}
		
		public Builder setLocations(Collection<LocationVertex> locationVertices) {
			graphData.locationVertices = locationVertices ;
			return this ;
		}
		
		public GraphData build() {
			return graphData ;
		}
		
	}
	
	private Collection<GraphEdge> graphEdges;
	private Collection<GraphVertex> graphVertices;
	private Collection<LocationVertex> locationVertices ;
	
	private GraphData() {
	}

	public Collection<GraphEdge> getGraphEdges() {
		return graphEdges;
	}

	public Collection<GraphVertex> getGraphVertices() {
		return graphVertices;
	}

	public Collection<LocationVertex> getLocationVertices() {
		return locationVertices;
	}
	
	

}
