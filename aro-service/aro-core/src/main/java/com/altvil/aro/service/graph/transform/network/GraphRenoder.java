package com.altvil.aro.service.graph.transform.network;

import java.util.Collection;
import java.util.Map;

import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface GraphRenoder {

	public abstract Map<GraphAssignment, GraphNode> getResolvedAssignments();

	public abstract void add(GraphAssignment va);

	public abstract void add(
			Collection<? extends GraphAssignment> vertexAssignments);

	public abstract GraphRenoder renodeGraph(GraphModel<GeoSegment> model);

	public abstract GraphModelBuilder<GeoSegment> getBuilder();
	
	public RenodedGraph renode() ;

}