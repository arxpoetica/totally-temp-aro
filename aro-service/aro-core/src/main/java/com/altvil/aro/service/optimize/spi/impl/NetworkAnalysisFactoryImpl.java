package com.altvil.aro.service.optimize.spi.impl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Predicate;

import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.CentralOfficeEquipment;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.graph.transform.ftp.HubModel;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.optimize.impl.CentralOfficeAssignment;
import com.altvil.aro.service.optimize.impl.DefaultFiberAssignment;
import com.altvil.aro.service.optimize.impl.DefaultGeneratingNode;
import com.altvil.aro.service.optimize.impl.DefaultGeneratingNode.BuilderImpl;
import com.altvil.aro.service.optimize.impl.FiberProducerConsumerFactory;
import com.altvil.aro.service.optimize.impl.NodeAssembler;
import com.altvil.aro.service.optimize.impl.RootAssignment;
import com.altvil.aro.service.optimize.impl.SplitterNodeAssignment;
import com.altvil.aro.service.optimize.model.AnalysisNode;
import com.altvil.aro.service.optimize.model.EquipmentAssignment;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.model.GeneratingNode.Builder;
import com.altvil.aro.service.optimize.spi.AnalysisContext;
import com.altvil.aro.service.optimize.spi.FiberStrandConverter;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;
import com.altvil.aro.service.optimize.spi.NetworkAnalysisFactory;
import com.altvil.aro.service.optimize.spi.NetworkGenerator;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilder;
import com.altvil.aro.service.optimize.spi.ParentResolver;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.aro.service.price.PricingModel;
import com.altvil.utils.StreamUtil;
import com.google.inject.Inject;

@Service
public class NetworkAnalysisFactoryImpl implements NetworkAnalysisFactory {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(NetworkAnalysisFactoryImpl.class.getName());

	private ApplicationContext applicationContext ;
	private GraphTransformerFactory graphTransformerFactory;

	// private PlanService planService;

	@Autowired
	@Inject
	public NetworkAnalysisFactoryImpl(
			GraphTransformerFactory graphTransformerFactory,
			ApplicationContext applicationContext) {
		super();
		this.graphTransformerFactory = graphTransformerFactory;
		this.applicationContext = applicationContext ;
		// this.planService = planService;
	}

	@Override
	public NetworkAnalysis createNetworkAnalysis(
			NetworkModelBuilder networkModelBuilder, OptimizerContext ctx,
			ScoringStrategy scoringStrategy) {
		return new NetworkAnalysisImpl(networkModelBuilder, ctx,
				scoringStrategy);
	}

	public class NetworkAnalysisImpl implements AnalysisContext,
			NetworkAnalysis {

		private OptimizerContext context;
		private NetworkModelBuilder networkModelBuilder;

		private Optional<CompositeNetworkModel> model = Optional.empty();
		private NetworkModel networkModel;
		private ParentResolver parentResolver;

		private GeneratingNode rootNode;
		private FtthThreshholds ftpThreshholds;
		private ScoringStrategy scoringStrategy;

		private Set<AroEntity> verifySet = new HashSet<>();

		private Set<LocationEntity> rejectedLocations = new HashSet<>();

		private ExtendededTreeMap<Double, GeneratingNode> treeMap = new ExtendededTreeMap<>();

		// private TreeMultimap<Double, GeneratingNode> treeMap = TreeMultimap
		// .create(Double::compare, GeneratingNodeComparator.COMPARATROR);

		public NetworkAnalysisImpl(NetworkModelBuilder networkModelBuilder,
				OptimizerContext context, ScoringStrategy scoringStrategy) {
			super();
			this.networkModelBuilder = networkModelBuilder;
			this.context = context;
			this.ftpThreshholds = context.getFtthThreshholds();
			this.scoringStrategy = scoringStrategy;

			init();
		}
		
		

		@Override
		public <S> S getService(Class<S> api) {
			return applicationContext.getBean(api) ;
		}



		@Override
		public boolean debugContains(GeneratingNode node) {
			return treeMap.containsEntry(node.getScore(), node);
		}

		@Override
		public Builder createNode(FiberAssignment fiberAssignment,
				EquipmentAssignment equipment) {
			return new BuilderImpl(new DefaultGeneratingNode(this, equipment,
					fiberAssignment, null));
		}

		@Override
		public boolean debugVerify(AroEntity entity) {
			return verifySet.add(entity);

		}

		@Override
		public FiberProducerConsumerFactory getFiberProducerConsumerFactory() {
			return FiberProducerConsumerFactory.FACTORY;
		}

		@Override
		public FiberStrandConverter getFiberStrandConverter() {
			return FiberStrandConverterImpl.CONVERTER;
		}

		@Override
		public ScoringStrategy getScoringStrategy() {
			return scoringStrategy;
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
			return parentResolver;
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

			// SerializerImpl serializer = new SerializerImpl(model.get());
			// rootNode.getEquipmentAssignment().serialize(rootNode,
			// serializer);
			// return Optional.of(serializer.getNetworkModel());
			return null;
		}

		@Override
		public NetworkGenerator lazySerialize() {
			long[] rejectedLocations = this.rejectedLocations.stream()
					.mapToLong(AroEntity::getObjectId).toArray();
			return new DefaultNetworkGenerator(networkModelBuilder,
					rejectedLocations);
		}

		@Override
		public Optional<CompositeNetworkModel> createNetworkModel() {
			return networkModelBuilder.createModel(applicationContext, StreamUtil.map(
					rejectedLocations, AroEntity::getObjectId));
		}

		private void regenerate() {

			model = createNetworkModel();

			treeMap.clear();
			rootNode = null;
			if (model.isPresent()) {

				Builder builder = DefaultGeneratingNode.build(this,
						new RootAssignment(null), new DefaultFiberAssignment(
								FiberType.ROOT, Collections.emptyList()));

				//
				// Builds Sources
				//

				model.get().getNetworkModels().forEach(n -> {
					if (n.getFiberSourceMapping().getChildren().size() > 0) {
						builder.addChild(assmbleNetwork(n));
					}
				});

				//
				// Assign Root node
				//
				rootNode = builder.build();

				verifyTree(new HashSet<Integer>(), rootNode);
			}
		}

		private void verifyTree(Set<Integer> hashCodes, GeneratingNode node) {
			Integer hashCode = System.identityHashCode(node);

			if (hashCodes.contains(hashCode)) {
				throw new RuntimeException("Not a tree");
			}

			if (!node.getAnalysisContext().debugContains(node)) {
				 System.out.println("Not regsitered " + node.getEquipmentAssignment());
			}

			hashCodes.add(hashCode);
			for (GeneratingNode n : node.getChildren()) {
				verifyTree(hashCodes, n);
			}

		}

		private Builder createSource(GraphEdgeAssignment coEdgeAssignment) {

			// TODO handle splice point

			EquipmentAssignment assignment = new CentralOfficeAssignment(
					coEdgeAssignment,
					(CentralOfficeEquipment) coEdgeAssignment.getAroEntity());

			return DefaultGeneratingNode.build(
					this,
					assignment,
					new DefaultFiberAssignment(FiberType.FEEDER, Collections
							.emptyList()));
		}

		private Builder assmbleNetwork(NetworkModel model) {
			//
			// Builds From the Fiber Source
			//

			networkModel = model;
			
			model.getFiberSourceMapping();

			GraphEdgeAssignment coEdgeAssignment = model
					.getFiberSourceMapping().getGraphAssignment();

			GraphNode coVertex = model.getVertex(FiberType.FEEDER, coEdgeAssignment);

			Builder source = createSource(coEdgeAssignment);

			source.addChild(new NodeAssembler(model, this, FiberType.FEEDER)
					.assemble(coVertex, model.getFiberSourceMapping(),
							model.getCentralOfficeFeederFiber()));

			source.build();

			return source;
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
			Iterator<GeneratingNode> itr = treeMap.iterator() ;
			while(itr.hasNext() ) {
				GeneratingNode n = itr.next() ;
				if( predicate.test(n) ) {
					return n ;
				}
			}
			return null ;
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

		@Override
		public SplitterNodeAssignment createSplitterNodeAssignment() {
			return new SplitterNodeAssignment(null,
					EntityFactory.FACTORY.createJunctionNode());
		}

		public String toString() {
			return new ToStringBuilder(this).append("rootNode", rootNode)
					.toString();
		}
	}

	private static class DefaultNetworkGenerator implements NetworkGenerator {

		private NetworkModelBuilder networkModelBuilder;
		private long[] rejectedLocations;

		public DefaultNetworkGenerator(NetworkModelBuilder networkModelBuilder,
				long[] rejectedLocations) {
			super();
			this.networkModelBuilder = networkModelBuilder;
			this.rejectedLocations = rejectedLocations;
		}

		@Override
		public Optional<CompositeNetworkModel> get(ApplicationContext applicationContext) {
			return networkModelBuilder.createModel(applicationContext, Arrays.asList(ArrayUtils.toObject(rejectedLocations)));
		}

		@Override
		public boolean matches(NetworkGenerator other) {
			if (other instanceof DefaultNetworkGenerator) {
				return ((DefaultNetworkGenerator) other).rejectedLocations
						.equals(rejectedLocations);
			}
			return false;
		}

	}

	private static class ExtendededTreeMap<K extends Comparable<K>, T> {

		private TreeMap<K, List<T>> treeMap = new TreeMap<>();

		public void clear() {
			treeMap.clear();
		}

//		public Collection<T> values() {
//			return treeMap.values().stream().flatMap(v -> v.stream())
//					.collect(Collectors.toList());
//
//		}

		public Iterator<T> iterator() {
			return new TreeListIterator<T>(treeMap.values().iterator());
		}

		public boolean remove(K key, T value) {

			List<T> list = treeMap.get(key);
			if (list != null) {
				boolean modified =  list.remove(value);
				if( list.size() == 0 ) {
					treeMap.remove(key) ;
				}
				return modified ;
			}
			return false;
		}

		public boolean put(K key, T value) {
			List<T> list = treeMap.get(key);
			
			boolean modified = true;
			
			if (list == null) {
				treeMap.put(key, list = new ArrayList<>());
			} else {
				if (list.remove(value)) {
					modified = false;
				}
			}			

			list.add(value);
			return modified;
		}
		
		
		public boolean containsEntry(K key, T value) {

			List<T> list = treeMap.get(key) ;
			return list != null && list.contains(value) ;
		}
	}

	private static class TreeListIterator<T> implements Iterator<T> {

		private Iterator<List<T>> listItr;
		private Iterator<T> innerItr;

		public TreeListIterator(Iterator<List<T>> listItr) {
			super();
			this.listItr = listItr;
			this.innerItr = listItr.hasNext() ? listItr.next().iterator()
					: new ArrayList<T>().iterator();
		}

		private void advance() {
			if (listItr.hasNext()) {
				innerItr = listItr.next().iterator();
			}
		}

		@Override
		public boolean hasNext() {
			return innerItr.hasNext();
		}

		@Override
		public T next() {
			T value = innerItr.next();
			if (!innerItr.hasNext()) {
				advance();
			}
			return value;
		}

	}

}
