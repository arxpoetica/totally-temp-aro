package com.altvil.aro.service.planing.impl;

import java.security.Principal;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.function.Function;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.apache.ignite.Ignite;
import org.apache.ignite.IgniteCompute;
import org.apache.ignite.cluster.ClusterGroup;
import org.apache.ignite.cluster.ClusterNode;
import org.apache.ignite.lang.IgniteCallable;
import org.apache.ignite.resources.SpringResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.FiberRouteRepository;
import com.altvil.aro.persistence.repository.NetworkNodeRepository;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.conversion.SerializationService;
import com.altvil.aro.service.entity.DropCable;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.job.impl.JobRequestIgniteCallable;
import com.altvil.aro.service.network.NetworkService;
import com.altvil.aro.service.optimize.FTTHOptimizerService;
import com.altvil.aro.service.optimize.NetworkPlanner;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.optimize.PricingModel;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.planing.MasterPlanBuilder;
import com.altvil.aro.service.planing.MasterPlanUpdate;
import com.altvil.aro.service.planing.NetworkPlanningService;
import com.altvil.aro.service.planing.ScoringStrategyFactory;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfiguration;
import com.altvil.aro.service.planning.optimization.strategies.OptimizationPlanConfiguration;
import com.altvil.utils.StreamUtil;


@Service("networkPlanningService")
public class NetworkPlanningServiceImpl implements NetworkPlanningService {
	private static final Logger	  log = LoggerFactory.getLogger(NetworkPlanningServiceImpl.class.getName());

	private boolean useIgnite = false ;
	
	@Autowired
	private NetworkPlanRepository networkPlanRepository;

	@Autowired
	private ApplicationContext appCtx ;
	
	private Ignite				  igniteGrid;
	private ExecutorService		  executorService;
	private ExecutorService		  wirePlanExecutor;
	private IgniteCompute		  wirePlanComputeGrid;

	@PostConstruct
	public void init() {
		if( useIgnite )  {
			initIgnite();
		} else {
			initLocal() ;
		}
	}
	
	private void initIgnite() {
		if (executorService == null && igniteGrid != null) {
			/*
			 * NOTE: we could be more sophisticated with service cluster
			 * definition. Here are examples: ClusterGroup networkPlanCluster =
			 * ignite.cluster().forAttribute("ROLE", "networkPlanning");
			 * ClusterGroup wirePlanCluster =
			 * ignite.cluster().forAttribute("ROLE", "wirePlanning"); or:
			 * ClusterGroup wirePlanCluster =
			 * ignite.cluster().forCacheNodes(NetworkServiceImpl.
			 * CACHE_ROAD_EDGES_BY_WIRECENTER_ID); together with:
			 * executorService = ignite.executorService(networkPlanCluster);
			 * wirePlanExecutor = ignite.executorService(wirePlanCluster);
			 */
			// we use the server cluster if available, otherwise compute takes
			// place locally
			ClusterGroup executorGroup = null;
			boolean forceLocalComputation = Boolean.parseBoolean(System.getProperty("forceLocalComputation", "false"));
			if (forceLocalComputation || 0 == (executorGroup = igniteGrid.cluster().forServers()).nodes().size()) {
				executorGroup = igniteGrid.cluster().forLocal();
				ClusterNode thisNode = executorGroup.node();
				log.warn("Ignite server cluster was empty, so we are falling back to local computation!"
						+ " Consistent ID:" + thisNode.consistentId() + " UUID:" + thisNode.id() + " HostNames:"
						+ thisNode.hostNames());
			}
			executorService = igniteGrid.executorService(executorGroup);
			wirePlanExecutor = igniteGrid.executorService(executorGroup);
			wirePlanComputeGrid = igniteGrid.compute(executorGroup);
		}
	}
	
	private void initLocal() {
		
		if( executorService == null ) {
			executorService = Executors.newFixedThreadPool(10) ;
			wirePlanExecutor = Executors.newFixedThreadPool(20);
		}
	}
	
	
	private interface LocalBinding {
		void init(ApplicationContext ctx) ;
	}
	
	private <T extends LocalBinding> T bind(T val) {
		if( !useIgnite )  {
			val.init(appCtx);
		}
		
		return val ;
	}
	
	public MasterPlanBuilder createMasterPlanBuilder(Principal creator,  IgniteCallable<MasterPlanUpdate> callable) {
		if( useIgnite ) {
			return new MasterPlanBuilder(creator, wirePlanComputeGrid, callable) ;
		} else {
			return new MasterPlanBuilder(creator, wirePlanExecutor, callable) ;
		}
	}
	

	@Autowired(required = false) // NOTE the method name determines the
								 // name/alias of Ignite grid which gets bound!
	//@IgniteInstanceResource
	public void setNetworkPlanningServiceIgniteGrid(Ignite igniteBean) {
		this.igniteGrid = igniteBean;
		init();
	}
	

	@Override
	public JobService.JobRequest<WirecenterNetworkPlan> optimizeWirecenter(Principal username,
			OptimizationPlanConfiguration optimizationPlanStrategy, FtthThreshholds constraints) {
		IgniteCallable<WirecenterNetworkPlan> callable = createOptimzedCallable(optimizationPlanStrategy, constraints);
		if( useIgnite ) {
			return new JobRequestIgniteCallable<WirecenterNetworkPlan>(username, wirePlanComputeGrid, callable);
		} else {
			return new JobRequestIgniteCallable<WirecenterNetworkPlan>(username, this.wirePlanExecutor, callable);
		}
	}

	@Override
	public MasterPlanBuilder optimizeMasterFiber(Principal requestor, OptimizationPlanConfiguration optimizationPlanStrategy,
			FtthThreshholds constraints) throws InterruptedException {

		networkPlanRepository.deleteWireCenterPlans(optimizationPlanStrategy.getPlanId());

		List<OptimizationPlanConfiguration> plans = StreamUtil
				.map(networkPlanRepository.computeWirecenterUpdates(optimizationPlanStrategy.getPlanId()), (plan)->optimizationPlanStrategy.dependentPlan(plan.longValue()));

		List<Future<WirecenterNetworkPlan>> futures = wirePlanExecutor.invokeAll(
				plans.stream().map(plan -> createOptimzedCallable(plan, constraints)).collect(Collectors.toList()));

		IgniteCallable<MasterPlanUpdate> callable = (() -> {
			return new MasterPlanUpdate(futures.stream().map(wf -> {
				try {
					return wf.get();
				} catch (Exception e) {
					log.error(e.getMessage());
					return null;
				}
			}).filter(p -> p != null).collect(Collectors.toList()));
		});
		MasterPlanBuilder builder =  createMasterPlanBuilder(requestor, callable);
		builder.setWireCenterPlans(plans);

		return builder;
	}

	@Override
	public MasterPlanBuilder planMasterFiber(Principal requestor, FiberPlanConfiguration fiberPlanConfiguration,
			FtthThreshholds constraints, GlobalConstraint globalConstraint) throws InterruptedException {
		networkPlanRepository.deleteWireCenterPlans(fiberPlanConfiguration.getPlanId());

		List<FiberPlanConfiguration> plans = StreamUtil
				.map(networkPlanRepository.computeWirecenterUpdates(fiberPlanConfiguration.getPlanId()), (plan)->fiberPlanConfiguration.dependentPlan(plan.longValue()));

		final List<Future<WirecenterNetworkPlan>> futures = wirePlanExecutor.invokeAll(
				plans.stream().map(plan -> createPlanningCallable(plan, constraints, globalConstraint)).collect(Collectors.toList()));

		IgniteCallable<MasterPlanUpdate> callable = (() -> {
			return new MasterPlanUpdate(futures.stream().map(wf -> {
				try {
					return wf.get();
				} catch (Exception e) {
					log.error(e.getMessage());
					return null;
				}
			}).filter(p -> p != null).collect(Collectors.toList()));
		});
		MasterPlanBuilder builder = createMasterPlanBuilder(requestor, callable);
		builder.setWireCenterPlans(plans);

		return builder;
	}

//	@Override
//	public MasterPlanBuilder planMasterFiber(Principal requestor, OptimizationPlanConfiguration fiberPlanConfiguration,
//			FtthThreshholds constraints) throws InterruptedException {
//		networkPlanRepository.deleteWireCenterPlans(fiberPlanConfiguration.getPlanId());
//
//		List<OptimizationPlanConfiguration> plans = StreamUtil.map(
//				networkPlanRepository.computeWirecenterUpdates(fiberPlanConfiguration.getPlanId()),
//				(dependentId) -> fiberPlanConfiguration.dependentPlan(dependentId.longValue()));
//
//		final List<Future<WirecenterNetworkPlan>> futures = wirePlanExecutor.invokeAll(
//				plans.stream().map(plan -> createPlanningCallable(plan, constraints)).collect(Collectors.toList()));
//
//		IgniteCallable<MasterPlanUpdate> callable = (() -> {
//			return new MasterPlanUpdate(futures.stream().map(wf -> {
//				try {
//					return wf.get();
//				} catch (Exception e) {
//					log.error(e.getMessage());
//					return null;
//				}
//			}).filter(p -> p != null).collect(Collectors.toList()));
//		});
//		MasterPlanBuilder builder = new MasterPlanBuilder(requestor, wirePlanComputeGrid, callable);
//		builder.setWireCenterPlans(plans);
//
//		return builder;
//	}

	@Override
	public Future<WirecenterNetworkPlan> planFiber(FiberPlanConfiguration fiberPlanStrategy,
			FtthThreshholds constraints, GlobalConstraint globalConstraint) {
		return executorService.submit(createPlanningCallable(fiberPlanStrategy, constraints, globalConstraint));
	}

	public static class FiberPlanningCallable implements IgniteCallable<WirecenterNetworkPlan>, LocalBinding {
		private static final long				 serialVersionUID = 1L;
		private final FiberPlanConfiguration	 fiberPlanStrategy;
		private final FtthThreshholds	 constraints;
		private final GlobalConstraint globalConstraint;

		@SpringResource(resourceName = "networkService")
		private transient NetworkService		 networkService;

		@SpringResource(resourceName = "planService")
		private transient PlanService			 planService;

		@SpringResource(resourceName = "fttHOptimizerService")
		private transient FTTHOptimizerService	 optimizerService;

		@SpringResource(resourceName = "scoringStrategyFactory")
		private transient ScoringStrategyFactory scoringStrategyFactory;

		@SpringResource(resourceName = "serializationService")
		private transient SerializationService	 conversionService;

		@SpringResource(resourceName = "networkNodeRepository")
		private transient NetworkNodeRepository	 networkNodeRepository;

		@SpringResource(resourceName = "fiberRouteRepository")
		private transient FiberRouteRepository	 fiberRouteRepository;

		FiberPlanningCallable(FiberPlanConfiguration fiberPlanStrategy, FtthThreshholds constraints, GlobalConstraint globalConstraint) {
			this.fiberPlanStrategy = fiberPlanStrategy;
			this.constraints = constraints;
			this.globalConstraint = globalConstraint;
		}
		
		

		@Override
		public void init(ApplicationContext ctx) {
			networkService = ctx.getBean(NetworkService.class) ;
			planService = ctx.getBean(PlanService.class) ;
			optimizerService = ctx.getBean(FTTHOptimizerService.class) ;
			scoringStrategyFactory = ctx.getBean(ScoringStrategyFactory.class) ;
			conversionService = ctx.getBean(SerializationService.class) ;
			networkNodeRepository = ctx.getBean(NetworkNodeRepository.class) ;
			fiberRouteRepository = ctx.getBean(FiberRouteRepository.class) ;
		}



		@Override
		public WirecenterNetworkPlan call() throws Exception {
			NetworkData networkData = networkService.getNetworkData(fiberPlanStrategy);

			ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder = fiberPlanStrategy
					.getClosestFirstSurfaceBuilder();
			Function<AroEdge<GeoSegment>, Set<GraphNode>> selectedEdges = fiberPlanStrategy.getSelectedEdges(networkData);

			Optional<CompositeNetworkModel> model = planService.computeNetworkModel(networkData,
					closestFirstSurfaceBuilder, selectedEdges, constraints, globalConstraint);
			if (model.isPresent()) {
				WirecenterNetworkPlan plan = conversionService.convert(fiberPlanStrategy.getPlanId(), model);
				networkNodeRepository.save(plan.getNetworkNodes());
				fiberRouteRepository.save(plan.getFiberRoutes());
				return plan;
			}

			return null;
		}
	}

	public static class OptimizationPlanningCallable implements IgniteCallable<WirecenterNetworkPlan>, LocalBinding {
		private static final long					serialVersionUID = 1L;
		private final OptimizationPlanConfiguration	fiberPlanStrategy;
		private final FtthThreshholds		constraints;
		private final GlobalConstraint globalConstraint;

		@SpringResource(resourceName = "networkService")
		private transient NetworkService			networkService;

		@SpringResource(resourceName = "planService")
		private transient PlanService				planService;

		@SpringResource(resourceName = "fttHOptimizerService")
		private transient FTTHOptimizerService		optimizerService;

		@SpringResource(resourceName = "scoringStrategyFactory")
		private transient ScoringStrategyFactory	scoringStrategyFactory;

		@SpringResource(resourceName = "serializationService")
		private transient SerializationService		conversionService;

		@SpringResource(resourceName = "networkNodeRepository")
		private transient NetworkNodeRepository		networkNodeRepository;

		@SpringResource(resourceName = "fiberRouteRepository")
		private transient FiberRouteRepository		fiberRouteRepository;

		OptimizationPlanningCallable(OptimizationPlanConfiguration fiberPlanStrategy,
				FtthThreshholds constraints, GlobalConstraint globalConstraint) {
			this.fiberPlanStrategy = fiberPlanStrategy;
			this.constraints = constraints;
			this.globalConstraint = globalConstraint;
		}
		
		@Override
		public void init(ApplicationContext ctx) {
			networkService = ctx.getBean(NetworkService.class) ;
			planService = ctx.getBean(PlanService.class) ;
			optimizerService = ctx.getBean(FTTHOptimizerService.class) ;
			scoringStrategyFactory = ctx.getBean(ScoringStrategyFactory.class) ;
			conversionService = ctx.getBean(SerializationService.class) ;
			networkNodeRepository = ctx.getBean(NetworkNodeRepository.class) ;
			fiberRouteRepository = ctx.getBean(FiberRouteRepository.class) ;
		}


		@Override
		public WirecenterNetworkPlan call() throws Exception {
			NetworkData networkData = networkService.getNetworkData(fiberPlanStrategy);

			ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder = fiberPlanStrategy
					.getClosestFirstSurfaceBuilder();
			Function<AroEdge<GeoSegment>, Set<GraphNode>> selectedEdges = fiberPlanStrategy.getSelectedEdges(networkData);

			Optional<CompositeNetworkModel> model = planService.computeNetworkModel(networkData,
					closestFirstSurfaceBuilder, selectedEdges, constraints, globalConstraint);
			if (model.isPresent()) {
				WirecenterNetworkPlan plan = conversionService.convert(fiberPlanStrategy.getPlanId(), model);
				networkNodeRepository.save(plan.getNetworkNodes());
				fiberRouteRepository.save(plan.getFiberRoutes());
				return plan;
			}

			return null;
		}
	}

	private IgniteCallable<WirecenterNetworkPlan> createPlanningCallable(FiberPlanConfiguration fiberPlanStrategy,
			FtthThreshholds constraints, GlobalConstraint globalConstraint) {
		return bind(new FiberPlanningCallable(fiberPlanStrategy, constraints, globalConstraint));
	}

	public static class OptimizeCallable implements IgniteCallable<WirecenterNetworkPlan>, LocalBinding {
		private static final long					serialVersionUID = 1L;
		private final OptimizationPlanConfiguration	optimizationPlanConfiguration;
		private final FtthThreshholds		constraints;

		@SpringResource(resourceName = "networkService")
		private transient NetworkService			networkService;

		@SpringResource(resourceName = "planService")
		private transient PlanService				planService;

		@SpringResource(resourceName = "fttHOptimizerService")
		private transient FTTHOptimizerService		optimizerService;

		@SpringResource(resourceName = "serializationService")
		private transient SerializationService		conversionService;

		@SpringResource(resourceName = "networkNodeRepository")
		private transient NetworkNodeRepository		networkNodeRepository;

		@SpringResource(resourceName = "fiberRouteRepository")
		private transient FiberRouteRepository		fiberRouteRepository;

		public OptimizeCallable(OptimizationPlanConfiguration optimizationPlanStrategy,
				FtthThreshholds constraints) {
			this.optimizationPlanConfiguration = optimizationPlanStrategy;
			this.constraints = constraints;
		}


		@Override
		public void init(ApplicationContext ctx) {
			networkService = ctx.getBean(NetworkService.class) ;
			planService = ctx.getBean(PlanService.class) ;
			optimizerService = ctx.getBean(FTTHOptimizerService.class) ;
			conversionService = ctx.getBean(SerializationService.class) ;
			networkNodeRepository = ctx.getBean(NetworkNodeRepository.class) ;
			fiberRouteRepository = ctx.getBean(FiberRouteRepository.class) ;
		}

		
		@Override
		public WirecenterNetworkPlan call() throws Exception {
			NetworkData networkData = networkService.getNetworkData(optimizationPlanConfiguration);

			optimizationPlanConfiguration.setNetworkData(networkData);

			OptimizerContext ctx = new OptimizerContext(new DefaultPriceModel(),
					constraints);

			double totalDemand = networkData.getRoadLocations().stream()
					.mapToDouble(a -> ((LocationEntity) a.getSource()).getLocationDemand().getDemand()).sum();

			log.info("Target total = " + totalDemand);

			NetworkPlanner planner = optimizerService.createNetworkPlanner(
					optimizationPlanConfiguration.getClosestFirstSurfaceBuilder(),
					optimizationPlanConfiguration.getSelectedEdges(networkData), optimizationPlanConfiguration,
					networkData, ctx, optimizationPlanConfiguration::generatingNodeConstraint, optimizationPlanConfiguration);

			Collection<OptimizedNetwork> optimizedPlans = planner.getOptimizedPlans();

			List<OptimizedNetwork> plans = optimizedPlans.stream()
					.filter(optimizationPlanConfiguration::satisfiesGlobalConstraint).collect(Collectors.toList());

			Collections.reverse(plans);
			Optional<OptimizedNetwork> model = plans.stream().findFirst();

			if (model.isPresent()) {
				WirecenterNetworkPlan plan = conversionService.convert(optimizationPlanConfiguration.getPlanId(),
						model.get().getNetworkPlan());

				networkNodeRepository.save(plan.getNetworkNodes());
				fiberRouteRepository.save(plan.getFiberRoutes());

				return plan;
			}

			return null;
		}

	}

	private IgniteCallable<WirecenterNetworkPlan> createOptimzedCallable(
			OptimizationPlanConfiguration optimizationPlanStrategy, FtthThreshholds constraints) {
		return bind(new OptimizeCallable(optimizationPlanStrategy, constraints));
	}

	private static class DefaultPriceModel implements PricingModel {

		@Override
		public double getPrice(DropCable dropCable) {
			return 0.5 * dropCable.getLength();
		}

		@Override
		public double getMaterialCost(MaterialType type) {
			switch (type) {
			case FDT:
				return 20;
			case FDH:
				return 2000;
			case BFT:
				return 400;
			case SPLITTER_16:
				return 1500;
			case SPLITTER_32:
				return 2000;
			case SPLITTER_64:
				return 2500;

			default:
				return 0;
			}
		}

		@Override
		public double getFiberCostPerMeter(FiberType fiberType, int requiredFiberStrands) {
			return 4;
		}

	}
}
