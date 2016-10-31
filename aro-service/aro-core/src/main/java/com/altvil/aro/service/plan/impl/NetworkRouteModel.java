package com.altvil.aro.service.plan.impl;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.EquipmentLinker;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.assigment.impl.FiberSourceMapping;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.transform.network.RenodedGraph;
import com.altvil.aro.service.plan.GeneratedFiberRoute;
import com.altvil.aro.service.plan.LocationModel;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.interfaces.NetworkAssignment;

public class NetworkRouteModel implements NetworkModel {

	//private LocationModel locationModel;

	private NetworkAssignment fiberSourceAssignment;
	
	private Map<FiberType, RenodedGraph> renodedGraphsMap ;
	
	private GeneratedFiberRoute feederFiber;
	private Map<GraphAssignment, GeneratedFiberRoute> distributionFiber;
	private FiberSourceMapping networkPlan;

	private Map<AroEntity, GraphAssignment> entityToAssignment = new HashMap<>();
	private Map<GraphAssignment, GraphMapping> assignmentToMapping = new HashMap<>();
	private Collection<EquipmentLinker> rejectedLinkers ;
	
	public NetworkRouteModel(
			NetworkAssignment fiberSourceAssignment,
			LocationModel locationModel,
			Map<FiberType, RenodedGraph> renodedGraphsMap,
			GeneratedFiberRoute feederFiber,
			Map<GraphAssignment, GeneratedFiberRoute> distributionFiber,
			FiberSourceMapping networkPlan,
			Collection<EquipmentLinker> rejectedLinkers) {
		super();
		this.fiberSourceAssignment = fiberSourceAssignment;
		
		this.renodedGraphsMap = renodedGraphsMap ;
		//this.dagModel = dagModel ;
		
		this.feederFiber = feederFiber;
		this.distributionFiber = distributionFiber;
		this.networkPlan = networkPlan;
		this.rejectedLinkers = rejectedLinkers;
		init(networkPlan);
	}


	@Override
	public Collection<EquipmentLinker> getRejectedEquipmentLinkers() {
		return rejectedLinkers;
	}


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
		return renodedGraphsMap.get(ft).getGraphNode(graphAssignment) ;
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