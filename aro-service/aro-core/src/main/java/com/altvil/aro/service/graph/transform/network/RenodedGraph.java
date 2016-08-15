package com.altvil.aro.service.graph.transform.network;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;

public class RenodedGraph {

	private GraphTransformerFactory transformFactory;

	private Map<GraphAssignment, GraphNode> map;
	private GraphModel<GeoSegment> graph;
	private Map<GraphNode, List<GraphAssignment>> graphAssignmentsMap;

	public RenodedGraph(GraphTransformerFactory transformFactory,
			Map<GraphAssignment, GraphNode> map, GraphModel<GeoSegment> graph) {
		super();
		this.transformFactory = transformFactory;
		this.map = map;
		this.graph = graph;

		graphAssignmentsMap = index(map);

	}

	private RenodedGraph(GraphTransformerFactory transformFactory,
			Map<GraphAssignment, GraphNode> map, GraphModel<GeoSegment> graph,
			Map<GraphNode, List<GraphAssignment>> graphAssignmentsMap) {
		super();
		this.transformFactory = transformFactory;
		this.map = map;
		this.graph = graph;
		this.graphAssignmentsMap = graphAssignmentsMap;
	}

	private static <K, T> Map<T, List<K>> index(Map<K, T> map) {

		Map<T, List<K>> result = new HashMap<>();

		map.entrySet().forEach(e -> {
			List<K> list = result.get(e.getKey());
			if (list == null) {
				result.put(e.getValue(), list = new ArrayList<K>());
			}
			list.add(e.getKey());
		});

		return result;

	}

	public List<GraphAssignment> getEdgeAssignments(GraphNode vertex) {
		return graphAssignmentsMap.get(vertex);
	}

	public GraphNode getGraphNode(GraphAssignment ga) {
		return map.get(ga);
	}

	public GraphModel<GeoSegment> getGraph() {
		return graph;
	}

	public RenodedGraph transform(Function<GeoSegment, Double> f) {
		//ByPpass for testing
		if( true ) {
			return this ;
		}
		
		return new RenodedGraph(transformFactory, map,
				transformFactory.transform(graph, f), graphAssignmentsMap);
	}

}
