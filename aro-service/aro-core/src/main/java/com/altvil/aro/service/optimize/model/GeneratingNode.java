package com.altvil.aro.service.optimize.model;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.FiberType;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;

import java.util.Collection;

public interface GeneratingNode extends AnalysisNode,
		Comparable<GeneratingNode> {

	FiberAssignment getFiberAssignment();

	EquipmentAssignment getEquipmentAssignment();

	void remove();

	GeneratingNode relink(GeneratingNode parent, FiberAssignment fiber);

	NetworkAnalysis getNetworkAnalysis();

	GeneratingNode getParent();

	Collection<GeneratingNode> getChildren();

	boolean isValueNode();

	boolean isJunctionNode();

	int getRequiredFiberStrands();

	interface Builder {

		Builder setJunctionNode(boolean juntionNode);

		Builder setFiber(FiberAssignment fiber);

		Builder setFiber(FiberType fiberType,
						 Collection<AroEdge<GeoSegment>> fiber);

		Builder addChild(EquipmentAssignment equipment);

		GeneratingNode build();
	}

}
