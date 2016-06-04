package com.altvil.aro.service.plan;

import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface GlobalConstraint {
	double nextParametric();
	boolean isConverging(DAGModel<GeoSegment> model);
}
