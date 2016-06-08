package com.altvil.aro.service.optimize.spi;

import java.util.Set;
import java.util.function.Function;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.plan.GlobalConstraint;

public interface NetworkModelBuilderFactory {

	public NetworkModelBuilder create(NetworkData networkData, ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder,
			Function<AroEdge<GeoSegment>, Set<GraphNode>> selectedEdges, 
			FtthThreshholds fiberConstraints, GlobalConstraint globalConstraints);

}
