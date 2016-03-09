package com.altvil.aro.service.optimize.spi.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.function.Predicate;
import java.util.function.Supplier;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.CentralOfficeEquipment;
import com.altvil.aro.service.entity.DefaultAroVisitor;
import com.altvil.aro.service.entity.FDHEquipment;
import com.altvil.aro.service.entity.FDTEquipment;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.RemoteTerminal;
import com.altvil.aro.service.entity.SplicePoint;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.FiberType;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.graph.transform.ftp.HubModel;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.optimize.PricingModel;
import com.altvil.aro.service.optimize.impl.CentralOfficeAssignment;
import com.altvil.aro.service.optimize.impl.CompositeNodeBuilder;
import com.altvil.aro.service.optimize.impl.DefaultFiberAssignment;
import com.altvil.aro.service.optimize.impl.DefaultGeneratingNode;
import com.altvil.aro.service.optimize.impl.FdhAssignment;
import com.altvil.aro.service.optimize.impl.FdtAssignment;
import com.altvil.aro.service.optimize.impl.GeneratingNodeAssembler;
import com.altvil.aro.service.optimize.impl.GeneratingNodeComparator;
import com.altvil.aro.service.optimize.impl.NoEquipment;
import com.altvil.aro.service.optimize.impl.RemoteTerminalAssignment;
import com.altvil.aro.service.optimize.impl.RootAssignment;
import com.altvil.aro.service.optimize.impl.SerializerImpl;
import com.altvil.aro.service.optimize.impl.SplicePointAssignment;
import com.altvil.aro.service.optimize.impl.SplitterNodeAssignment;
import com.altvil.aro.service.optimize.model.AnalysisNode;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.model.GeneratingNode.Builder;
import com.altvil.aro.service.optimize.spi.AnalysisContext;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;
import com.altvil.aro.service.optimize.spi.NetworkAnalysisFactory;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilder;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.utils.StreamUtil;
import com.google.common.collect.TreeMultimap;
import com.google.inject.Inject;

@Service
public class NetworkAnalysisFactoryImpl implements NetworkAnalysisFactory {

	private static FiberAssignment EMPTY_DIST = new DefaultFiberAssignment(FiberType.DISTRIBUTION, Collections.emptyList()) ;
	
	private GraphTransformerFactory graphTransformerFactory;
	private PlanService planService;

	@Autowired
	@Inject
	public NetworkAnalysisFactoryImpl(
			GraphTransformerFactory graphTransformerFactory,
			PlanService planService) {
		super();
		this.graphTransformerFactory = graphTransformerFactory;
		this.planService = planService;
	}

	@Override
	public NetworkAnalysis createNetworkAnalysis(
			NetworkModelBuilder networkModelBuilder, OptimizerContext ctx) {
		return new NetworkAnalysisImpl(networkModelBuilder, ctx);
	}

	private static class BuilderFactory extends DefaultAroVisitor {

		private AnalysisContext ctx;

		private Builder parent;
		
		
		private GraphNode vertex ;
		private GraphMapping graphMapping;
		private GraphEdgeAssignment graphAssignment;

		private Builder nodeBuilder;

		public BuilderFactory(AnalysisContext ctx) {
			super();
			this.ctx = ctx;
		}

		public Builder addChild(Builder parent, GraphNode vertex, GraphMapping graphMapping) {

			this.parent = parent;
			this.vertex = vertex ;
			this.graphMapping = graphMapping;
			this.graphAssignment = graphMapping.getGraphAssignment();

			nodeBuilder = null;
			graphMapping.getAroEntity().accept(this);
			return nodeBuilder;
		}

		private void createAnalyis(Builder builder, GraphMapping gm,
								   FiberType ft, Collection<AroEdge<GeoSegment>> pathEdges) {
			new GeneratingNodeAssembler(ctx, ft).createAnalysis(builder, vertex, gm,
					pathEdges);

			nodeBuilder = builder;
		}

		@Override
		public void visit(CentralOfficeEquipment node) {
			createAnalyis(parent.addChild(new CentralOfficeAssignment(graphAssignment, node)),
					graphMapping,
					FiberType.FEEDER,
					ctx.getNetworkModel().getCentralOfficeFeederFiber());
		}
		
		
		

		@Override
		public void visit(RemoteTerminal node) {
			createAnalyis(parent.addChild(new RemoteTerminalAssignment(graphAssignment, node)),
					graphMapping,
					FiberType.FEEDER,
					ctx.getNetworkModel().getCentralOfficeFeederFiber());
		}

		@Override
		public void visit(SplicePoint node) {
			createAnalyis(parent.addChild(new SplicePointAssignment(graphAssignment, node)),
					graphMapping,
					FiberType.FEEDER,
					ctx.getNetworkModel().getCentralOfficeFeederFiber());
		}

		@Override
		public void visit(FDTEquipment node) {
			
			nodeBuilder = parent.addChild(new FdtAssignment(graphAssignment,
					node, StreamUtil.map(graphMapping.getChildAssignments(),
					a -> (GraphEdgeAssignment) a))).setFiber(EMPTY_DIST);
		}

		@Override
		public void visit(FDHEquipment node) {
			createAnalyis(
					parent.addChild(new FdhAssignment(graphAssignment, node)),
					graphMapping,
					FiberType.DISTRIBUTION,
					ctx.getNetworkModel().getFiberRouteForFdh(
							graphMapping.getGraphAssignment()));

		}
	}

	public class NetworkAnalysisImpl implements AnalysisContext,
			NetworkAnalysis {

		private OptimizerContext context;
		private NetworkModelBuilder networkModelBuilder;

		private Optional<CompositeNetworkModel> model = Optional.empty();
		private NetworkModel networkModel ;

		private BuilderFactory builderFactory;
		private GeneratingNode rootNode;
		private FtthThreshholds ftpThreshholds;
		

		private Set<LocationEntity> rejectedLocations = new HashSet<>();

		private TreeMultimap<Double, GeneratingNode> treeMap = TreeMultimap
				.create(Double::compare, GeneratingNodeComparator.COMPARATROR);

		public NetworkAnalysisImpl(NetworkModelBuilder networkModelBuilder,
				OptimizerContext context) {
			super();
			this.networkModelBuilder = networkModelBuilder;
			this.context = context;
			this.ftpThreshholds = context.getFtpThreshholds() ;
			planService.createFtthThreshholds(this.context
					.getFiberNetworkConstraints());

			builderFactory = new BuilderFactory(this);

			init();
		}
		
		@Override
		public NetworkModelBuilder getNetworkModelBuilder() {
			return networkModelBuilder ;
		}


		@Override
		public NetworkModel getNetworkModel() {
			return networkModel ;
		}



		@Override
		public HubModel getHubModel() {
			return ftpThreshholds.getHubModel();
		}

		@Override
		public PricingModel getPricingModel() {
			return context.getPricingModel();
		}

		private void init() {
			if (!model.isPresent()) {
				regenerate();
			}
		}

		@Override
		public void rebuildRequired(GeneratingNode node) {
			model = Optional.empty();
		}

		@Override
		public OptimizerContext getOptimizerContext() {
			return context;
		}
		


		@Override
		public Optional<CompositeNetworkModel> serialize() {

			SerializerImpl serializer = new SerializerImpl(model.get());
			rootNode.getEquipmentAssignment().serialize(rootNode, serializer);
			return Optional.of(serializer.getNetworkModel());
		}
		
		

		@Override
		public Supplier<Optional<CompositeNetworkModel>> lazySerialize() {
			Set<LocationEntity> _rejectedLocations  = new HashSet<LocationEntity>(this.rejectedLocations) ;
			return new Supplier<Optional<CompositeNetworkModel>>() {
				@Override
				public Optional<CompositeNetworkModel> get() {
					return networkModelBuilder.createModel(StreamUtil.map(
							_rejectedLocations, AroEntity::getObjectId)) ;
				}
			};
		}
		

		@Override
		public Optional<CompositeNetworkModel> createNetworkModel() {
			return networkModelBuilder.createModel(StreamUtil.map(
					rejectedLocations, AroEntity::getObjectId)) ;
		}
		
		
		private void regenerate() {

			model = createNetworkModel() ;
			
			treeMap.clear();
			rootNode = null;
			if (model.isPresent()) {

				Builder builder = DefaultGeneratingNode.build(this,
						new RootAssignment(null));

				//
				// Builds Sources
				//
				
				model.get().getNetworkModels().forEach(n -> {
					if( n.getFiberSourceMapping().getChildren().size() > 0 ) {
						assmbleNetwork(n, builder) ;
					}
				});
				
				
				//
				// Assign Root node
				//
				rootNode = builder
						.setFiber(FiberType.BACKBONE, Collections.emptyList())
						.build();
			}
		}
		
		
		private void assmbleNetwork(NetworkModel model, Builder builder) {
			//
			// Builds From the Fiber Source
			//
			
			networkModel = model;
			
			GraphEdgeAssignment coEdgeAssignment = model.getFiberSourceMapping().getGraphAssignment() ;
			GraphNode coVertex = model.getVertex(coEdgeAssignment) ;
			
			addNode(coVertex, coEdgeAssignment, builder)
					.setFiber(FiberType.BACKBONE, Collections.emptyList())
					.build();
			
		}

		@Override
		public Collection<LocationEntity> getRejectetedLocations() {
			return rejectedLocations;
		}

		@Override
		public double getNpv() {
			// TODO Auto-generated method stub
			return 0;
		}

		@Override
		public double getIrr() {
			// TODO Auto-generated method stub
			return 0;
		}

		@Override
		public void addToAnalysis(GeneratingNode node) {
			treeMap.put(node.getScore(), node);
		}

		@Override
		public void removeFromAnalysis(GeneratingNode node) {
			rejectedLocations.addAll(node.getFiberCoverage().getLocations());
			treeMap.remove(node.getScore(), node);
		}

		@Override
		public void changing_end(GeneratingNode node) {
			treeMap.put(node.getScore(), node);

		}

		@Override
		public void changing_start(GeneratingNode node) {
			treeMap.remove(node.getScore(), node);
		}

		@Override
		public AnalysisNode getAnalyisNode() {
			init();
			return rootNode;
		}

		@Override
		public GeneratingNode getMinimumNode(Predicate<GeneratingNode> predicate) {
			for (GeneratingNode n : treeMap.values()) {
				if (predicate.test(n)) {
					return n;
				}
			}
			return null;
		}

		@Override
		public GraphTransformerFactory getGraphTransformerFactory() {
			return NetworkAnalysisFactoryImpl.this.graphTransformerFactory;
		}


		@Override
		public NetworkAnalysis getNetworkAnalysis() {
			return this;
		}

		@Override
		public boolean isFullAnalysisMode() {
			return context.isFullAnalysisModel();
		}

		private Builder addNode(GraphNode vertex, GraphAssignment graphAssignment, Builder parent) {
			return builderFactory.addChild(parent, vertex,
					networkModel.getGraphMapping(graphAssignment));
		}

		@Override
		public Builder addNode(FiberType fiberType,
				Collection<GraphAssignment> assignments, Builder parent,  GraphNode vertex) {

			if (assignments.size() == 0) {
				return addSplitterNode(parent);
			}

			if (assignments.size() == 1) {
				return addNode(vertex, assignments.iterator().next(), parent);
			}

			Builder builder = new CompositeNodeBuilder(
					parent.addChild(NoEquipment.ASSIGNMENT));
			builder.setFiber(new DefaultFiberAssignment(fiberType,
					new ArrayList<>()));

			assignments.forEach(a -> {
				addNode(vertex, a, builder);
			});

			return builder;
		}

		@Override
		public Builder addSplitterNode(Builder parent) {
			return parent.addChild(new SplitterNodeAssignment()).setJunctionNode(true);
		}

		@Override
		public Supplier<LocationDemand> getCoverageScoreSupplier() {
			return context.getCoverageScoreSupplier();
		}

	}

}
