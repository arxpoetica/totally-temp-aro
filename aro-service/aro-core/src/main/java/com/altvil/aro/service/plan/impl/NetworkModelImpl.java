package com.altvil.aro.service.plan.impl;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.assigment.impl.FiberSourceMapping;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.plan.GeneratedFiberRoute;
import com.altvil.aro.service.plan.LocationModel;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.interfaces.NetworkAssignment;

public class NetworkModelImpl implements NetworkModel {

	//private LocationModel locationModel;

	private NetworkAssignment fiberSourceAssignment;
	//private GraphModel<GeoSegment> dagModel;
	//private GraphModel<GeoSegment> graphModel;
	private Map<GraphAssignment, GraphNode> resolvedModel;

	private GeneratedFiberRoute feederFiber;
	private Map<GraphAssignment, GeneratedFiberRoute> distributionFiber;
	private FiberSourceMapping networkPlan;

	private Map<AroEntity, GraphAssignment> entityToAssignment = new HashMap<>();
	private Map<GraphAssignment, GraphMapping> assignmentToMapping = new HashMap<>();

	public NetworkModelImpl(
			NetworkAssignment fiberSourceAssignment,
			LocationModel locationModel,

			GraphModel<GeoSegment> dagModel,
			GraphModel<GeoSegment> graphModel,

			GeneratedFiberRoute feederFiber,
			Map<GraphAssignment, GeneratedFiberRoute> distributionFiber,
			FiberSourceMapping networkPlan,
			Map<GraphAssignment, GraphNode> resolvedModel) {
		super();
		this.fiberSourceAssignment = fiberSourceAssignment;
		//this.locationModel = locationModel;
		//this.dagModel = dagModel;

		//this.graphModel = graphModel;
		this.feederFiber = feederFiber;
		this.distributionFiber = distributionFiber;
		this.networkPlan = networkPlan;
		this.resolvedModel = resolvedModel;

		init(networkPlan);
	}

//	@Override
//	public NetworkModel createNetworkModel(
//			Collection<AroEdge<GeoSegment>> feederFiber,
//			Map<GraphAssignment, Collection<AroEdge<GeoSegment>>> distributionFiber,
//			FiberSourceMapping co) {
//
//		return new NetworkModelImpl(fiberSourceAssignment, locationModel, dagModel, graphModel,
//				feederFiber, distributionFiber, co, resolvedModel);
//	}

	private void register(GraphMapping gm) {
		entityToAssignment.put(gm.getAroEntity(), gm.getGraphAssignment());
		assignmentToMapping.put(gm.getGraphAssignment(), gm);
	}

	private void init(FiberSourceMapping co) {
		register(co);
		co.getChildren().forEach(fdh -> {
			register(fdh);
			fdh.getChildren().forEach(fdt -> {
				register(fdt);
			});
		});
	}

	@Override
	public GraphMapping getGraphMapping(GraphAssignment ga) {
		return assignmentToMapping.get(ga);
	}

	@Override
	public FiberSourceMapping getFiberSourceMapping() {
		return networkPlan;
	}

	@Override
	public GraphNode getVertex(FiberType ft, GraphAssignment graphAssignment) {
		return resolvedModel.get(graphAssignment);
	}

	@Override
	public NetworkAssignment getFiberSourceAssignment() {
		return fiberSourceAssignment;
	}

	@Override
	public GeneratedFiberRoute getCentralOfficeFeederFiber() {
		return feederFiber;
	}

	@Override
	public GeneratedFiberRoute getFiberRouteForFdh(
			GraphAssignment ga) {
		return distributionFiber.get(ga);
	}
	
	public String toString() {
		return ToStringBuilder.reflectionToString(this);
	}
}