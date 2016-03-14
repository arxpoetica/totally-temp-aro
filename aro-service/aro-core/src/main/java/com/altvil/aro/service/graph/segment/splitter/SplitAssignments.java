package com.altvil.aro.service.graph.segment.splitter;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.node.GraphNode;

public class SplitAssignments {

	public static class Builder {
		private SplitAssignments assignments = new SplitAssignments();

		public Builder assign(GraphEdgeAssignment assignment, GraphNode vertex) {
			assignments.mappedVerticies.put(assignment, vertex);
			return this;
		}
		
		public Builder add(EdgeAssignment edgeAssignment) {
			assignments.edgeAssignments.add(edgeAssignment) ;
			return this ;
		}
		
		public Builder assign(Collection<GraphEdgeAssignment> vertexAssigmnents, GraphNode vertex) {
			vertexAssigmnents.forEach(a -> {
				assignments.mappedVerticies.put(a, vertex) ;
			});
			return this ;
		}
		
		public  SplitAssignments build() {
			return assignments ;
		}

	}

	private Collection<EdgeAssignment> edgeAssignments = new ArrayList<>() ;
	private Map<GraphAssignment, GraphNode> mappedVerticies = new HashMap<>() ;

	public Collection<EdgeAssignment> getEdgeAssignments() {
		return edgeAssignments;
	}

	public Map<GraphAssignment, GraphNode> getMappedVerticies() {
		return mappedVerticies;
	}
	
	

}
