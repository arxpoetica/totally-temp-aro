package com.altvil.aro.service.optimize.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jgrapht.DirectedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.BulkFiberTerminal;
import com.altvil.aro.service.entity.CentralOfficeEquipment;
import com.altvil.aro.service.entity.DefaultAroVisitor;
import com.altvil.aro.service.entity.FDHEquipment;
import com.altvil.aro.service.entity.FDTEquipment;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.optimize.model.EquipmentAssignment;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.model.GeneratingNode.Builder;
import com.altvil.aro.service.optimize.spi.AnalysisContext;
import com.altvil.aro.service.plan.GeneratedFiberRoute;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.aro.util.DescribeGraph;
import com.altvil.utils.StreamUtil;
import com.google.common.collect.Multimap;
import com.google.common.collect.Multimaps;

public class NodeAssembler {
	
	private static final Logger log = LoggerFactory
			.getLogger(NodeAssembler.class.getName());

	private static Map<FiberType, Set<Class<?>>> matchingEquipmentMap = new HashMap<>();
	
	static {
		matchingEquipmentMap.put(FiberType.BACKBONE,
				StreamUtil.asSet(CentralOfficeEquipment.class));
		matchingEquipmentMap.put(FiberType.FEEDER,
				StreamUtil.asSet(FDHEquipment.class, BulkFiberTerminal.class));
		matchingEquipmentMap.put(FiberType.DISTRIBUTION,
				StreamUtil.asSet(FDTEquipment.class));
		matchingEquipmentMap.put(FiberType.DROP,
				StreamUtil.asSet(LocationEntity.class));
	}

	private AnalysisContext ctx;
	private DirectedGraph<GraphNode, AroEdge<GeoSegment>> graph;
	private DAGModel<GeoSegment> dagModel;
	private NetworkModel networkModel;
	
	private Multimap<GraphNode, GraphEdgeAssignment> equipmentMap;
	private FiberType fiberType ;
	private Set<Class<?>> matchingEquipmentType;
	private List<AroEdge<GeoSegment>> fiberPath = new ArrayList<>();
	private Set<AroEntity> visited = new HashSet<AroEntity>() ;
	
	public NodeAssembler(NetworkModel networkModel, AnalysisContext ctx,
			FiberType fiberType) {
		this.networkModel = networkModel ;
		this.ctx = ctx;
		this.fiberType = fiberType ;
		
		matchingEquipmentType = matchingEquipmentMap.get(fiberType);
		DescribeGraph.trace(log, graph);
	}
	
	public  GeneratingNode.Builder assemble(GraphNode vertex, GraphMapping gm,
			GeneratedFiberRoute generatedFiberRoute) {
		
		//this.dagModel = createDagModel(vertex, pathEdges);
		this.dagModel = generatedFiberRoute.createDagModel(
				ctx.getService(GraphTransformerFactory.class)
					.createDagBuilder()) ;
		this.graph = this.dagModel.getAsDirectedGraph();

		equipmentMap = createEquipmentMap(ctx.getNetworkModel(), gm);
		
		return depthFirstTraversal(vertex, 1) ;
		
		
	}
	
//	private DAGModel<GeoSegment> createDagModel(GraphNode vertex,
//			Collection<AroEdge<GeoSegment>> pathEdges) {
//
//		GraphModelBuilder<GeoSegment> b = ctx.getGraphTransformerFactory()
//				.createGraphBuilder();
//		if (pathEdges.size() == 0) {
//			b.addVertex(vertex);
//		} else {
//			for (AroEdge<GeoSegment> e : pathEdges) {
//				b.add(e.getSourceNode(), e.getTargetNode(), e.getValue(),
//						e.getWeight());
//			}
//		}
//
//		return ctx.getGraphTransformerFactory().createDAG(b.build(), vertex,
//				e -> true);
//
//	}
		
	private Multimap<GraphNode, GraphEdgeAssignment> createEquipmentMap(
			NetworkModel model, GraphMapping mapping) {
		
		Multimap<GraphNode, GraphEdgeAssignment> map = Multimaps
				.newListMultimap(new HashMap<>(), ArrayList::new);
		
		mapping.getChildAssignments().forEach(
				a -> map.put(model.getVertex(fiberType, a), a));
		
		return map;
	}

	private List<AroEdge<GeoSegment>> extractFiberPath() {
		List<AroEdge<GeoSegment>> result = new ArrayList<>(fiberPath);
		fiberPath.clear();
		return result;
	}
	
	private Collection<GraphEdgeAssignment> getGraphAssignments(
			GraphNode vertex, int level) {
	
		Collection<GraphEdgeAssignment> gas = equipmentMap.get(vertex);
		if (gas == null) {
			return Collections.emptyList();
		}

		return StreamUtil.filter(gas,
				a -> matchingEquipmentType.contains(a.getAroEntity().getType())
						&& !visited.contains(a.getAroEntity()));

	}
	
	private GeneratingNode.Builder depthFirstTraversal(GraphNode vertex,
			int level) {
	
		GeneratingNode.Builder childBuilder = null;
		
		// Basis Equipment Node
		Collection<GraphEdgeAssignment> gas = getGraphAssignments(vertex, level);
		if (gas.size() > 0) {

			gas.forEach(a -> {
				visited.add(a.getAroEntity()) ;
			});

			// childBuilder = ctx.addNode(new DefaultFiberAssignment(fiberType,
			// extractFiberPath()), gas, builder, vertex);
			childBuilder = addNode(new DefaultFiberAssignment(fiberType,
					extractFiberPath()), gas, vertex);
		}

		Collection<AroEdge<GeoSegment>> edges = graph.incomingEdgesOf(vertex);

		if (edges.size() > 0) {
			if (edges.size() == 1 && childBuilder == null) {
				//
				// No Equipment at this node and fiber is not split so special
				// case
				// induction to combine Fiber
				//
				AroEdge<GeoSegment> e = edges.iterator().next();
				fiberPath.add(e);
				return depthFirstTraversal(e.getSourceNode(), level);
			}
		} 
		
		if (childBuilder == null) {
			childBuilder = ctx.createNode(new DefaultFiberAssignment(fiberType,
					extractFiberPath()), new SplitterNodeAssignment(null,
					EntityFactory.FACTORY.createJunctionNode()));
		}
		
		// Induction
		childBuilder.addChildren(depthFirstTraversal(edges, level +1)) ; 
		
		childBuilder.build() ;
		
		return childBuilder ;

	}

	private Collection<GeneratingNode.Builder> depthFirstTraversal(
									 Collection<AroEdge<GeoSegment>> edges, int level) {

		//Partition Edges
		
		List<GeneratingNode.Builder> result = new ArrayList<>() ;
		
		edges.forEach(e -> {
			fiberPath.add(e);
			result.add(depthFirstTraversal(e.getSourceNode(), level));
		});
		
		return result ;
	}
	
	private GeneratingNode.Builder addNode(GraphNode vertex,
			FiberAssignment fiberAssignment, GraphAssignment graphAssignment) {
		
		GraphMapping gm = networkModel.getGraphMapping(graphAssignment) ;
		
		Dispatcher dispatcher = new Dispatcher() {

			private GeneratingNode.Builder createNode(
					EquipmentAssignment equipment) {
				return ctx.createNode(fiberAssignment, equipment) ;
			}
			
			@Override
			public void visit(CentralOfficeEquipment co) {
				GeneratingNode.Builder node = createNode(new CentralOfficeAssignment(
						(GraphEdgeAssignment) graphAssignment, co));
				
				node.addChild(new NodeAssembler(networkModel, ctx,
						FiberType.FEEDER).assemble(vertex, gm,
						networkModel.getFiberRouteForFdh(graphAssignment)));
				update(node) ;
			}
			
			@Override
			public void visit(FDHEquipment fdh) {
				GeneratingNode.Builder node = createNode(new FdhAssignment(
						(GraphEdgeAssignment) graphAssignment, fdh));
				node.addChild(new NodeAssembler(networkModel, ctx,
						FiberType.DISTRIBUTION).assemble(vertex, gm,
						networkModel.getFiberRouteForFdh(graphAssignment)));
				update(node) ;
			}

			@Override
			public void visit(FDTEquipment node) {
				update(createNode(new FdtAssignment(gm))) ;
			}

			@Override
			public void visit(BulkFiberTerminal fiberTerminal) {
				update(createNode(new BulkFiberTerminalAssignment(gm))) ;
			}
		} ;
		
		graphAssignment.getAroEntity().accept(dispatcher);
		
		return dispatcher.getNode() ;

	}
	
	public SplitterNodeAssignment createSplitterNodeAssignment() {
		return new SplitterNodeAssignment(null,
				EntityFactory.FACTORY.createJunctionNode());
	}
	
	private GeneratingNode.Builder addNode(FiberAssignment fiberAssignment,
			Collection<GraphEdgeAssignment> assignments, GraphNode vertex) {

		if (assignments.size() == 0) {
			return ctx.createNode(fiberAssignment,
					createSplitterNodeAssignment());
		}

		if (assignments.size() == 1) {
			return addNode(vertex, fiberAssignment, assignments.iterator()
					.next());
		}
		
//		System.out.print("cluster types ");
//		for(GraphAssignment ga : assignments) {
//			System.out.print(" | ");
//			System.out.print(ga.getAroEntity().getType().getSimpleName()) ;
//		}
//		System.out.println("") ;
		
		Builder splitter = ctx.createNode(fiberAssignment,
				ctx.createSplitterNodeAssignment());
		
		FiberAssignment emptyAssignment = new DefaultFiberAssignment(
				fiberAssignment.getFiberType(), Collections.emptyList());
		assignments.forEach(a -> {
			
			Builder b = addNode(vertex,emptyAssignment, a) ;
			b.build() ;
			splitter.addChild(b);
		});
		
		return splitter ;
		
	}
	
	public class Dispatcher extends DefaultAroVisitor {
		private GeneratingNode.Builder node ;
		
		public GeneratingNode.Builder getNode() {
			return node ;
		}
		
		protected void update(GeneratingNode.Builder node) {
			this.node = node ;
		}
	}
	
//	nodeBuilder = parent.addChild(
//			fiberAssignment,
//			new FdtAssignment(graphAssignment, node, StreamUtil.map(
//					graphMapping.getChildAssignments(),
//					a -> (GraphEdgeAssignment) a)));
	
}
