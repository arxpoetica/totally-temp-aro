package com.altvil.aro.service.optimize.spi.impl;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.function.Predicate;
import java.util.function.Supplier;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.BulkFiberTerminal;
import com.altvil.aro.service.entity.CentralOfficeEquipment;
import com.altvil.aro.service.entity.DefaultAroVisitor;
import com.altvil.aro.service.entity.FDHEquipment;
import com.altvil.aro.service.entity.FDTEquipment;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.LocationDropAssignment;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.RemoteTerminal;
import com.altvil.aro.service.entity.SplicePoint;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.graph.transform.ftp.HubModel;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.optimize.impl.BulkFiberTerminalAssignment;
import com.altvil.aro.service.optimize.impl.CentralOfficeAssignment;
import com.altvil.aro.service.optimize.impl.DefaultFiberAssignment;
import com.altvil.aro.service.optimize.impl.DefaultGeneratingNode;
import com.altvil.aro.service.optimize.impl.FdhAssignment;
import com.altvil.aro.service.optimize.impl.FdtAssignment;
import com.altvil.aro.service.optimize.impl.FiberProducerConsumerFactory;
import com.altvil.aro.service.optimize.impl.GeneratingNodeAssembler;
import com.altvil.aro.service.optimize.impl.GeneratingNodeComparator;
import com.altvil.aro.service.optimize.impl.RemoteTerminalAssignment;
import com.altvil.aro.service.optimize.impl.RootAssignment;
import com.altvil.aro.service.optimize.impl.SplicePointAssignment;
import com.altvil.aro.service.optimize.impl.SplitterNodeAssignment;
import com.altvil.aro.service.optimize.model.AnalysisNode;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.model.GeneratingNode.Builder;
import com.altvil.aro.service.optimize.spi.AnalysisContext;
import com.altvil.aro.service.optimize.spi.FiberStrandConverter;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;
import com.altvil.aro.service.optimize.spi.NetworkAnalysisFactory;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilder;
import com.altvil.aro.service.optimize.spi.ParentResolver;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.price.PricingModel;
import com.altvil.utils.StreamUtil;
import com.google.common.collect.TreeMultimap;
import com.google.inject.Inject;

@Service
public class NetworkAnalysisFactoryImpl implements NetworkAnalysisFactory {

	private static final Logger log = LoggerFactory
			.getLogger(NetworkAnalysisFactoryImpl.class.getName());
	
	
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
			NetworkModelBuilder networkModelBuilder, OptimizerContext ctx, ScoringStrategy scoringStrategy) {
		return new NetworkAnalysisImpl(networkModelBuilder, ctx, scoringStrategy);
	}

	private static class BuilderFactory extends DefaultAroVisitor {

		private AnalysisContext ctx;

		private Builder parent;

		private GraphNode vertex;
		private FiberAssignment fiberAssignment;
		private GraphMapping graphMapping;
		private GraphEdgeAssignment graphAssignment;

		private Builder nodeBuilder;

		public BuilderFactory(AnalysisContext ctx) {
			super();
			this.ctx = ctx;
		}

		public Builder addChild(Builder parent, GraphNode vertex,
				FiberAssignment fiberAssignment,
				GraphMapping graphMapping) {

			this.parent = parent;
			this.vertex = vertex;
			this.fiberAssignment = fiberAssignment ;
			this.graphMapping = graphMapping;
			this.graphAssignment = graphMapping.getGraphAssignment();

			nodeBuilder = null;
			graphMapping.getAroEntity().accept(this);
			return nodeBuilder;
		}

		private void createAnalyis(Builder builder, GraphMapping gm,
				FiberType ft, Collection<AroEdge<GeoSegment>> pathEdges) {
			new GeneratingNodeAssembler(ctx, ft).createAnalysis(builder, (p, g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode, AroEdge<GeoSegment>>(g, s),
					vertex, gm, pathEdges);

			nodeBuilder = builder;
		}

		@Override
		public void visit(CentralOfficeEquipment node) {
			createAnalyis(parent.addChild(fiberAssignment, new CentralOfficeAssignment(
					graphAssignment, node)), graphMapping, FiberType.FEEDER,
					ctx.getNetworkModel().getCentralOfficeFeederFiber());
		}

		@Override
		public void visit(RemoteTerminal node) {
			createAnalyis(parent.addChild(fiberAssignment, new RemoteTerminalAssignment(
					graphAssignment, node)), graphMapping, FiberType.FEEDER,
					ctx.getNetworkModel().getCentralOfficeFeederFiber());
		}

		@Override
		public void visit(BulkFiberTerminal node) {
			nodeBuilder = parent.addChild(fiberAssignment, new BulkFiberTerminalAssignment(
					graphAssignment, node)) ;
		}

		@Override
		public void visit(SplicePoint node) {
			createAnalyis(parent.addChild(fiberAssignment, new SplicePointAssignment(
					graphAssignment, node)), graphMapping, FiberType.FEEDER,
					ctx.getNetworkModel().getCentralOfficeFeederFiber());
		}
		
		private void dump(FDTEquipment node) {
			System.out.print("FDT ") ;
			for(LocationDropAssignment lds : node.getDropAssignments()) {
				System.out.print(lds.getLocationEntity().getObjectId()) ;
				System.out.print(" ") ;
				System.out.print(lds.getAssignedEntityDemand().getDemand()) ;
				System.out.print(" | ") ;
			}
			System.out.println();
			
		}

		@Override
		public void visit(FDTEquipment node) {
			
			if( log.isTraceEnabled() ) {
				dump(node) ;
			}

			nodeBuilder = parent.addChild(
					fiberAssignment,
					new FdtAssignment(graphAssignment, node, StreamUtil.map(
							graphMapping.getChildAssignments(),
							a -> (GraphEdgeAssignment) a)));
		}

		@Override
		public void visit(FDHEquipment node) {
			createAnalyis(
					parent.addChild(fiberAssignment, new FdhAssignment(graphAssignment, node)),
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
		private NetworkModel networkModel;
		private ParentResolver parentResolver ;

		private BuilderFactory builderFactory;
		private GeneratingNode rootNode;
		private FtthThreshholds ftpThreshholds;
		private ScoringStrategy scoringStrategy ;
		
		private Set<AroEntity> verifySet = new HashSet<>() ;

		private Set<LocationEntity> rejectedLocations = new HashSet<>();

		private TreeMultimap<Double, GeneratingNode> treeMap = TreeMultimap
				.create(Double::compare, GeneratingNodeComparator.COMPARATROR);

		public NetworkAnalysisImpl(NetworkModelBuilder networkModelBuilder,
				OptimizerContext context, ScoringStrategy scoringStrategy) {
			super();
			this.networkModelBuilder = networkModelBuilder;
			this.context = context;
			this.ftpThreshholds = context.getFtthThreshholds();
			this.scoringStrategy = scoringStrategy ;
			
			builderFactory = new BuilderFactory(this);

			init();
		}
		

		@Override
		public boolean debugVerify(AroEntity entity) {
			return verifySet.add(entity) ;
			
		}


		@Override
		public FiberProducerConsumerFactory getFiberProducerConsumerFactory() {
			return FiberProducerConsumerFactory.FACTORY ;
		}


		@Override
		public FiberStrandConverter getFiberStrandConverter() {
			return FiberStrandConverterImpl.CONVERTER ;
		}


		@Override
		public ScoringStrategy getScoringStrategy() {
			return scoringStrategy ;
		}

		@Override
		public NetworkModelBuilder getNetworkModelBuilder() {
			return networkModelBuilder;
		}

		@Override
		public NetworkModel getNetworkModel() {
			return networkModel;
		}
		
		

		@Override
		public ParentResolver getParentResolver() {
			return parentResolver ;
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

//			SerializerImpl serializer = new SerializerImpl(model.get());
//			rootNode.getEquipmentAssignment().serialize(rootNode, serializer);
//			return Optional.of(serializer.getNetworkModel());
			return null ;
		}

		@Override
		public Supplier<Optional<CompositeNetworkModel>> lazySerialize() {
			Set<LocationEntity> _rejectedLocations = new HashSet<LocationEntity>(
					this.rejectedLocations);
			return new Supplier<Optional<CompositeNetworkModel>>() {
				@Override
				public Optional<CompositeNetworkModel> get() {
					return networkModelBuilder.createModel(StreamUtil.map(
							_rejectedLocations, AroEntity::getObjectId));
				}
			};
		}

		@Override
		public Optional<CompositeNetworkModel> createNetworkModel() {
			return networkModelBuilder.createModel(StreamUtil.map(
					rejectedLocations, AroEntity::getObjectId));
		}

		private void regenerate() {

			model = createNetworkModel();

			treeMap.clear();
			rootNode = null;
			if (model.isPresent()) {

				Builder builder = DefaultGeneratingNode.build(this,
						new RootAssignment(null), new DefaultFiberAssignment(FiberType.ROOT,Collections.emptyList()));

				//
				// Builds Sources
				//

				model.get().getNetworkModels().forEach(n -> {
					if (n.getFiberSourceMapping().getChildren().size() > 0) {
						assmbleNetwork(n, builder);
					}
				});

				//
				// Assign Root node
				//
				rootNode = builder.build();
			}
		}

		private void assmbleNetwork(NetworkModel model, Builder builder) {
			//
			// Builds From the Fiber Source
			//

			networkModel = model;
			parentResolver = new ParentResolverImpl(model) ;
			

			GraphEdgeAssignment coEdgeAssignment = model
					.getFiberSourceMapping().getGraphAssignment();
			GraphNode coVertex = model.getVertex(coEdgeAssignment);
			addNode(coVertex, 	new DefaultFiberAssignment(FiberType.BACKBONE, Collections.emptyList()), coEdgeAssignment, builder).build();
		}

		@Override
		public Collection<LocationEntity> getRejectetedLocations() {
			return rejectedLocations;
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

		private Builder addNode(GraphNode vertex,
				FiberAssignment fiberAssignment,
				GraphAssignment graphAssignment, Builder parent) {
			
			return builderFactory.addChild(parent, vertex, fiberAssignment,
					networkModel.getGraphMapping(graphAssignment));
		}
		
		@Override
		public Builder addNode(FiberAssignment fiberAssignment,
				Collection<GraphEdgeAssignment> assignments, Builder parent,
				GraphNode vertex) {

			if (assignments.size() == 0) {
				return parent.addChild(fiberAssignment, createSplitterNodeAssignment()) ;
			}

			if (assignments.size() == 1) {
				return addNode(vertex, fiberAssignment, assignments.iterator().next(), parent);
			}
			
			System.out.print("cluster types ");
			for(GraphAssignment ga : assignments) {
				System.out.print(" | ");
				System.out.print(ga.getAroEntity().getType().getSimpleName()) ;
			}
			System.out.println("") ;
			
			Builder builder = parent.addCompositeChild(fiberAssignment) ;
			
//			builder.setFiber(new DefaultFiberAssignment(fiberAssigment,
//					new ArrayList<>()));

			FiberAssignment emptyAssignment = new DefaultFiberAssignment(fiberAssignment.getFiberType(), Collections.emptyList()) ;
			assignments.forEach(a -> {
				addNode(vertex,emptyAssignment, a, builder);
			});
			
			builder.setInitMode(false) ;
			

			return builder;
		}
		
		@Override
		public SplitterNodeAssignment createSplitterNodeAssignment() {
			 return new SplitterNodeAssignment(null, EntityFactory.FACTORY.createJunctionNode()) ;
		}
		
		public String toString() {
			return new ToStringBuilder(this).append("rootNode", rootNode).toString();
		}
	}

}
