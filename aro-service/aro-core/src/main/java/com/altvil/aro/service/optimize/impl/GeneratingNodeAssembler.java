package com.altvil.aro.service.optimize.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;

import org.jgrapht.DirectedGraph;
import org.jgrapht.graph.SimpleDirectedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.entity.AroEntity;
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
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.AnalysisContext;
import com.altvil.aro.service.optimize.spi.ParentResolver;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.aro.util.DescribeGraph;
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
	private  DirectedGraph<GraphNode, AroEdge<GeoSegment>> graph;
	private DAGModel<GeoSegment> dagModel;
	private Multimap<GraphNode, GraphEdgeAssignment> equipmentMap;
	private FiberType fiberType ;
	private Set<Class<?>> matchingEquipmentType;
	private List<AroEdge<GeoSegment>> fiberPath = new ArrayList<>();
	private ParentResolver parentResolver ;
	private Set<AroEntity> visited = new HashSet<AroEntity>() ;

	public GeneratingNodeAssembler(AnalysisContext ctx, FiberType fiberType) {
		this.ctx = ctx;
		this.fiberType = fiberType ;
		this.parentResolver = ctx.getParentResolver() ;
		matchingEquipmentType = matchingEquipmentMap.get(fiberType);
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

	public void createAnalysis(GeneratingNode.Builder builder, ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder, GraphNode vertex, GraphMapping gm,
			Collection<AroEdge<GeoSegment>> pathEdges) {

//		// pathEdges is a subset of the plan being optimized. As such, it is a
//		// sparse graph containing what may be the minimum number of edges
//		// necessary to connect the root vertex with the target(s).
//		//
//		// There doesn't appear to be any point in searching such a confined space for alternatives.  Simply assemble a graph so that it can be traversed.
//		graph  = new SimpleDirectedWeightedGraph<GraphNode, AroEdge<GeoSegment>>(new AroEdgeFactory<GeoSegment>() {
//			@Override
//			public AroEdge<GeoSegment> createEdge(GraphNode sourceVertex, GraphNode targetVertex) {
//				throw new IllegalStateException("This graph can not create its own edges.");
//			}});
//
//		graph.addVertex(vertex);
//		pathEdges.forEach((e) -> {
//			graph.addVertex(e.getSourceNode());
//			graph.addVertex(e.getTargetNode());
//			graph.addEdge(e.getSourceNode(), e.getTargetNode(), e);
//		});
		
		this.dagModel = createDagModel(vertex, pathEdges);
		this.graph = this.dagModel.getAsDirectedGraph();
		DescribeGraph.debug(log, graph);

		equipmentMap = createEquipmentMap(ctx.getNetworkModel(), gm);
		
		if( graph.edgeSet().size() > 0 ) {
			depthFirstTraversal(builder,
					graph.incomingEdgesOf(vertex), 1);
		} 
		
//		if( getGraphAssignments(builder.getParentAssignment(), vertex, 1).size() > 0 )  {
//			depthFirstTraversal(builder, vertex, 1);
//		}
		
		depthFirstTraversal(builder, vertex, 1);
	}
	
	private Multimap<GraphNode, GraphEdgeAssignment> createEquipmentMap(
			NetworkModel model, GraphMapping mapping) {
		
		Multimap<GraphNode, GraphEdgeAssignment> map = Multimaps.newListMultimap(
				new HashMap<>(),
				ArrayList::new);
		
//		mapping.getChildAssignments().forEach(a -> {
//			log.info("assign equipment " + model.getVertex(a)  + " -> " + a.getAroEntity());
//		}) ;

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

		
		if(  builder.getAssignment() == null ) {
			//log.info("dft  spliiter  " + vertex + " " + level);
			
		} else {
			
			if(visited.contains( builder.getAssignment().getAroEntity()) ) {
				return ;
			}
			
			visited.add( builder.getAssignment().getAroEntity()) ;
			
//			if( builder.getAssignment().getAroEntity().getObjectId().longValue() == -1L) {
//				int x = 10 ;
//				int y = x ;
//				
//				log.info("dft " +  vertex + " " + builder.getAssignment().getAroEntity() + " " + level);
//				
//			}
			
			//log.info("dft " +  vertex + " " + builder.getAssignment().getAroEntity() + " " + level);
		}
	
		
		GeneratingNode.Builder childBuilder = null;
		
		
		// Basis Equipment Node
		Collection<GraphEdgeAssignment> gas = getGraphAssignments(builder.getParentAssignment(), vertex, level);
		if (gas.size() > 0) {
			
//			gas.forEach( a -> {
//				log.info("assign " + a.getAroEntity() + " " + vertex);
//			});

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
			}
			
			if (childBuilder == null) {
				// TODO create Synthetic
				
				childBuilder =  builder.addChild(new DefaultFiberAssignment(fiberType, extractFiberPath()), new SplitterNodeAssignment(null, EntityFactory.FACTORY.createJunctionNode())) ;
			
				log.info("add splitter node " + vertex);
//				depthFirstTraversal(childBuilder, edges,1); 
//				return ;
				
			}
			
			
			// Induction
			depthFirstTraversal(childBuilder, edges, level +1); 
		} 
		
		if( childBuilder != null ) {
			childBuilder.build() ;
		} else {
			System.err.println("Failed to terminate child node " + vertex);
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
