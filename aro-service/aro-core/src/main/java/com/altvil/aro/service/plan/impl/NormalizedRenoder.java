package com.altvil.aro.service.plan.impl;

import java.util.Collection;
import java.util.Map;

import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.network.GraphRenoder;

public class NormalizedRenoder implements GraphRenoder {

	private GraphRenoder renoder;

	public NormalizedRenoder(GraphRenoder renoder) {
		super();
		this.renoder = renoder;
	}

	@Override
	public Map<GraphAssignment, GraphNode> getResolvedAssignments() {
		return renoder.getResolvedAssignments();
	}

	// TODO generalize GraphAssignment transforms
	@Override
	public void add(GraphAssignment va) {
		if (va instanceof GraphEdgeAssignment) {
			//41582281
			GraphEdgeAssignment ge = (GraphEdgeAssignment) va ; 
			if( ge.getGeoSegment().getGid() != null && ge.getGeoSegment().getGid() == 41582281) {
				int x = 10 ;
			}
			
			renoder.add(ge.getAsRootEdgeAssignment());
		} else {
			renoder.add(va);
		}

	}

	@Override
	public void add(Collection<? extends GraphAssignment> vertexAssignments) {
		vertexAssignments.forEach(this::add);
	}

	@Override
	public GraphRenoder renodeGraph(GraphModel<GeoSegment> model) {
		renoder.renodeGraph(model);
		return this;
	}

	@Override
	public GraphModelBuilder<GeoSegment> getBuilder() {
		return renoder.getBuilder();
	}

}
