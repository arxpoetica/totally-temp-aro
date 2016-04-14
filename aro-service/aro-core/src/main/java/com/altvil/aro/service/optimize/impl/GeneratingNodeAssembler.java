package com.altvil.aro.service.optimize.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;

import org.eclipse.jetty.util.log.Log;
import org.jgrapht.DirectedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.entity.BulkFiberTerminal;
import com.altvil.aro.service.entity.CentralOfficeEquipment;
import com.altvil.aro.service.entity.FDHEquipment;
import com.altvil.aro.service.entity.FDTEquipment;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.AnalysisContext;
import com.altvil.aro.service.optimize.spi.ParentResolver;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.aro.service.plan.impl.PlanServiceImpl;
import com.altvil.utils.StreamUtil;
import com.google.common.collect.Multimap;
import com.google.common.collect.Multimaps;

public class GeneratingNodeAssembler {

	private static final Logger log = LoggerFactory
			.getLogger(GeneratingNodeAssembler.class.getName());

	
	private static Map<FiberType, Set<Class<?>>> matchingEquipmentMap = new HashMap<>();

	
	
	static {
		matchingEquipmentMap.put(FiberType.BACKBONE, StreamUtil.asSet(CentralOfficeEquipment.class));
		matchingEquipmentMap.put(FiberType.FEEDER,  StreamUtil.asSet(FDHEquipment.class, BulkFiberTerminal.class)) ;
		matchingEquipmentMap.put(FiberType.DISTRIBUTION, StreamUtil.asSet(FDTEquipment.class));
		matchingEquipmentMap.put(FiberType.DROP, StreamUtil.asSet(LocationEntity.class));
	}

	private AnalysisContext ctx;
	private DAGModel<GeoSegment> dagModel;
	private DirectedGraph<GraphNode, AroEdge<GeoSegment>> graph;
	private Multimap<GraphNode, GraphEdgeAssignment> equipmentMap;
	private FiberType fiberType ;
	private Set<Class<?>> matchingEquipmentType;
	private List<AroEdge<GeoSegment>> fiberPath = new ArrayList<>();
	private ParentResolver parentResolver ;

	public GeneratingNodeAssembler(AnalysisContext ctx, FiberType fiberType) {
		this.ctx = ctx;
		this.fiberType = fiberType ;
		this.parentResolver = ctx.getParentResolver() ;
		matchingEquipmentType = matchingEquipmentMap.get(fiberType);
	}

	public void createAnalysis(GeneratingNode.Builder builder, GraphNode vertex, GraphMapping gm,
			Collection<AroEdge<GeoSegment>> pathEdges) {

		this.dagModel = createDagModel(vertex, pathEdges);
		this.graph = this.dagModel.getAsDirectedGraph();

		equipmentMap = createEquipmentMap(ctx.getNetworkModel(), gm);
		
		if( graph.edgeSet().size() > 0 ) {
			depthFirstTraversal(builder,
					graph.incomingEdgesOf(vertex), 1);
		} 
		
		if( getGraphAssignments(builder.getParentAssignment(), vertex, 1).size() > 0 )  {
			depthFirstTraversal(builder, vertex, 1);
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

	private Multimap<GraphNode, GraphEdgeAssignment> createEquipmentMap(
			NetworkModel model, GraphMapping mapping) {
		Multimap<GraphNode, GraphEdgeAssignment> map = Multimaps.newListMultimap(
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
	
	
	private Collection<GraphEdgeAssignment> getGraphAssignments(GraphEdgeAssignment parentAssignment, GraphNode vertex, int level) {
		
		Predicate<GraphEdgeAssignment> parentPredicate = 
				parentAssignment == null || level > 1 ? ((ga) -> {
					if( !ctx.debugVerify(ga.getAroEntity()) ) {
						log.warn("Duplicate No Parent Node detected " + ga.getAroEntity());
						return false ;
					}
					return true ;
					
				}) : (ga) -> {
					
					GraphEdgeAssignment pa = parentResolver.getParentAssignment(ga) ;
					
					if( pa == null ) {
						System.out.println("Failed ") ;
					}
					else {
						if( !ctx.debugVerify(ga.getAroEntity()) ) {
							log.warn("Duplicate Node detected " + ga.getAroEntity());
							return false ;
						}
						System.out.println( pa.getAroEntity() + " <-> " + parentAssignment.getAroEntity()) ;
					}
					
					
					return pa == null ? false : pa.equals(parentAssignment) ;
				} ;
		
		Collection<GraphEdgeAssignment> gas = equipmentMap.get(vertex);
		if (gas == null) {
			return Collections.emptyList();
		}

		return StreamUtil.filter(gas, a -> matchingEquipmentType.contains(a.getAroEntity().getType()) && parentPredicate.test(a));

	}
	
	
	
	private void depthFirstTraversal(GeneratingNode.Builder builder, GraphNode vertex, int level) {

		GeneratingNode.Builder childBuilder = null;
		
		
		// Basis Equipment Node
		Collection<GraphEdgeAssignment> gas = getGraphAssignments(builder.getParentAssignment(), vertex, level);
		if (gas.size() > 0) {

			//Partition edges
			childBuilder = ctx.addNode(new DefaultFiberAssignment(fiberType, extractFiberPath()), gas, builder, vertex);
		
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
				depthFirstTraversal(builder, e.getSourceNode(), level);
				return ;
			} else {
	
				if (childBuilder == null) {
					// TODO create Synthetic
					
					childBuilder =  builder.addChild(new DefaultFiberAssignment(fiberType, extractFiberPath()), new SplitterNodeAssignment(null, EntityFactory.FACTORY.createJunctionNode())) ;
				}
				
				// Induction
				depthFirstTraversal(childBuilder, edges, level +1);
				
			} 
		} 
		
		if( childBuilder != null ) {
			childBuilder.build() ;
		} else {
			System.err.println("Failed to terminate child node");
		}

	}

	private void depthFirstTraversal(GeneratingNode.Builder nodeBuilder,
									 Collection<AroEdge<GeoSegment>> edges, int level) {

		//Partition Edges
		
		edges.forEach(e -> {
			fiberPath.add(e);
			depthFirstTraversal(nodeBuilder, e.getSourceNode(), level);
		});

	}


}
