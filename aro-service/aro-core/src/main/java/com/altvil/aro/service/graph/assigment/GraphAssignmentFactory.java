package com.altvil.aro.service.graph.assigment;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.graph.segment.PinnedLocation;

public interface GraphAssignmentFactory {

	public GraphEdgeAssignment createEdgeAssignment(PinnedLocation pl,
			AroEntity aroEntity);

}
