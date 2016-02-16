package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.entity.CentralOfficeEquipment;
import com.altvil.aro.service.entity.FDHEquipment;
import com.altvil.aro.service.entity.FDTEquipment;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.FiberType;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.AnalysisContext;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.utils.StreamUtil;
import com.google.common.collect.Multimap;
import com.google.common.collect.Multimaps;


import org.jgrapht.DirectedGraph;

import java.util.*;

public class GeneratingNodeAssembler {

	private static Map<FiberType, Class<?>> matchingEquipmentMap = new HashMap<>();

	static {
		matchingEquipmentMap.put(FiberType.BACKBONE, CentralOfficeEquipment.class);
		matchingEquipmentMap.put(FiberType.FEEDER, FDHEquipment.class);
		matchingEquipmentMap.put(FiberType.DISTRIBUTION, FDTEquipment.class);
		matchingEquipmentMap.put(FiberType.DROP, LocationEntity.class);
	}

	private AnalysisContext ctx;
	private DAGModel<GeoSegment> dagModel;
	private DirectedGraph<GraphNode, AroEdge<GeoSegment>> graph;
	private Multimap<GraphNode, GraphAssignment> equipmentMap;
	private FiberType fiberType ;
	private Class<?> matchingEquipmentType;
	private List<AroEdge<GeoSegment>> fiberPath = new ArrayList<>();

	public GeneratingNodeAssembler(AnalysisContext ctx, FiberType fiberType) {
		this.ctx = ctx;
		this.fiberType = fiberType ;
		matchingEquipmentType = matchingEquipmentMap.get(fiberType);
	}

	public void createAnalysis(GeneratingNode.Builder builder, GraphNode vertex, GraphMapping gm,
			Collection<AroEdge<GeoSegment>> pathEdges) {

		this.dagModel = createDagModel(vertex, pathEdges);
		this.graph = this.dagModel.getAsDirectedGraph();

		equipmentMap = createEquipmentMap(ctx.getNetworkModel(), gm);
		
		if( graph.edgeSet().size() > 0 ) {
			depthFirstTraversal(builder,
					graph.incomingEdgesOf(vertex));
		} 
		
		if( getGraphAssignments(vertex).size() > 0 )  {
			depthFirstTraversal(builder, vertex);
		}
		

	}
	
	private DAGModel<GeoSegment> createDagModel(GraphNode vertex,
			Collection<AroEdge<GeoSegment>> pathEdges) {
		
		
		GraphModelBuilder<GeoSegment> b = ctx.getGraphTransformerFactory()
				.createGraphBuilder();
		if( pathEdges.size() == 0 ) {
			b.addVertex(vertex) ;
		} else {
			for (AroEdge<GeoSegment> e : pathEdges) {
				b.add(e.getSourceNode(), e.getTargetNode(), e.getValue(),
						e.getWeight());
			}
		}
		
		return ctx.getGraphTransformerFactory().createDAG(b.build(), vertex, e -> true) ;
		
//		b.setRoot(vertex);
//		return b.buildDAG();

	}

	private Multimap<GraphNode, GraphAssignment> createEquipmentMap(
			NetworkModel model, GraphMapping mapping) {
		Multimap<GraphNode, GraphAssignment> map = Multimaps.newListMultimap(
				new HashMap<>(),
				ArrayList::new);

		mapping.getChildAssignments().forEach(a -> map.put(model.getVertex(a), a));

		return map;
	}

	private List<AroEdge<GeoSegment>> extractFiberPath() {
		List<AroEdge<GeoSegment>> result = new ArrayList<>(fiberPath);
		fiberPath.clear();
		return result;
	}

	private Collection<GraphAssignment> getGraphAssignments(GraphNode vertex) {
		Collection<GraphAssignment> gas = equipmentMap.get(vertex);
		if (gas == null) {
			return Collections.emptyList();
		}

		return StreamUtil.filter(gas, a -> a.getAroEntity().getType().equals(matchingEquipmentType));

	}
	
	
	
	private void depthFirstTraversal(GeneratingNode.Builder builder, GraphNode vertex) {

		GeneratingNode.Builder childBuilder = null;
		
		// Basis Equipment Node
		Collection<GraphAssignment> gas = getGraphAssignments(vertex);
		if (gas.size() > 0) {

			//Partition edges
			childBuilder = ctx.addNode(fiberType, gas, builder, vertex);
		
		}

		Collection<AroEdge<GeoSegment>> edges = graph.incomingEdgesOf(vertex);

		if (edges.size() > 0) {
			if (edges.size() == 1 && childBuilder == null) {
				//
				// No Equipment at this node and fiber is not split so special case
				// induction to combine Fiber
				//
				AroEdge<GeoSegment> e = edges.iterator().next();
				fiberPath.add(e);
				depthFirstTraversal(builder, e.getSourceNode());
				return ;
			} else {
	
				if (childBuilder == null) {
					// TODO create Synthetic
					childBuilder = ctx.addSplitterNode(builder);
				}
	
				childBuilder.setFiber(fiberType, extractFiberPath());
	
				// Induction
				depthFirstTraversal(childBuilder, edges);
				
			} 
		} else {
			if( childBuilder != null ) {
				childBuilder.setFiber(fiberType, extractFiberPath());
			}
		}
		
		if( childBuilder != null ) {
			childBuilder.build() ;
		} else {
			System.err.println("Failed to terminate child node");
		}

	}

	private void depthFirstTraversal(GeneratingNode.Builder nodeBuilder,
									 Collection<AroEdge<GeoSegment>> edges) {

		//Partition Edges
		
		edges.forEach(e -> {
			fiberPath.add(e);
			depthFirstTraversal(nodeBuilder, e.getSourceNode());
		});

	}


}
