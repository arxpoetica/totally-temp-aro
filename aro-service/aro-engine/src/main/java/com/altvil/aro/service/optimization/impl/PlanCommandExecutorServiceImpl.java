package com.altvil.aro.service.optimization.impl;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.AnalysisArea;
import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.model.ServiceArea;
import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.model.SuperServiceArea;
import com.altvil.aro.persistence.repository.AnalysisAreaRepository;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.persistence.repository.ServiceAreaRepository;
import com.altvil.aro.persistence.repository.ServiceLayerRepository;
import com.altvil.aro.persistence.repository.SuperServiceAreaRepository;
import com.altvil.aro.service.conversion.SerializationService;
import com.altvil.aro.service.demand.AroDemandService;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.aro.service.network.LocationSelectionMode;
import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.ProcessLayerCommand;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.spatial.AnalysisSelection;
import com.altvil.aro.service.optimization.spatial.SpatialAnalysisType;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterPlanningService;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.plan.impl.PlanServiceImpl;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.report.GeneratedPlan;
import com.altvil.utils.StreamUtil;

@Service
public class PlanCommandExecutorServiceImpl implements
		PlanCommandService {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(PlanServiceImpl.class.getName());

	private NetworkPlanRepository networkPlanRepository;
	private ServiceAreaRepository serviceAreaRepository;
	private AnalysisAreaRepository analysisAreaRepository;
	private SuperServiceAreaRepository superServiceAreaRepository;
	private ServiceLayerRepository serviceLayerRepository;
	private SerializationService conversionService;
	private WirecenterPlanningService wirecenterPlanningService;
	private AroDemandService aroDemandService;

	private ServiceAreaAnalyzer serviceAreaAnalyzer;

	@Autowired
	public PlanCommandExecutorServiceImpl(
			NetworkPlanRepository networkPlanRepository,
			ServiceAreaRepository serviceAreaRepository,
			AnalysisAreaRepository analysisAreaRepository,
			SuperServiceAreaRepository superServiceAreaRepository,
			ServiceLayerRepository serviceLayerRepository,
			SerializationService conversionService,
			WirecenterPlanningService wirecenterPlanningService,
			AroDemandService aroDemandService) {
		super();
		this.networkPlanRepository = networkPlanRepository;
		this.serviceAreaRepository = serviceAreaRepository;
		this.analysisAreaRepository = analysisAreaRepository;
		this.superServiceAreaRepository = superServiceAreaRepository;
		this.serviceLayerRepository = serviceLayerRepository;
		this.conversionService = conversionService;
		this.wirecenterPlanningService = wirecenterPlanningService;
		this.aroDemandService = aroDemandService;

		this.serviceAreaAnalyzer = new ServiceAreaAnalyzer();
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see com.altvil.aro.service.optimization.impl.PlanCommandExectorService#
	 * deleteOldPlans(long)
	 */
	@Override
	public void deleteOldPlans(long planId) {
		networkPlanRepository.deleteWireCenterPlans(planId);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see com.altvil.aro.service.optimization.impl.PlanCommandExectorService#
	 * createLayerCommands
	 * (com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest
	 * )
	 */
	@Override
	public Collection<ProcessLayerCommand> createLayerCommands(
			MasterOptimizationRequest request) {

		return serviceLayerRepository.findAll(request.getProcessingLayers())
				.stream().map(l -> this.computeWireCenterRequests(l, request))
				.collect(Collectors.toList());
	}

	@Override
	public GeneratedPlan reifyPlan(OptimizationConstraints constraints,
			PlannedNetwork plan) {
		WirecenterNetworkPlan reifiedPlan = conversionService.convert(
				plan.getPlanId(), Optional.of(plan.getPlannedNetwork()));

		NetworkDemandSummary demandSummary = toNetworkDemandSummary(
				reifiedPlan.getDemandCoverage(),
				plan.getCompetitiveDemandMapping());

		// log.debug("ds ====>" + demandSummary.toString());

		return new GeneratedPlanImpl(demandSummary, constraints, reifiedPlan);

	}

	@Override
	public OptimizedPlan summarize(GeneratedPlan plan) {
		return wirecenterPlanningService.summarize(plan);
	}

	@Override
	public void save(OptimizedPlan plan) {
		wirecenterPlanningService.save(plan);
	}

	@Override
	public OptimizedPlan reifyPlanSummarizeAndSave(OptimizationConstraints constraints,
			PlannedNetwork plan) {

		OptimizedPlan optimizedPlan = summarize(reifyPlan(constraints, plan)) ;
		save(optimizedPlan);
		return optimizedPlan ;
		
	}

	protected NetworkDemandSummary toNetworkDemandSummary(DemandCoverage dc,
			CompetitiveDemandMapping mapping) {

		Collection<CompetitiveLocationDemandMapping> plannedDemand = dc
				.getLocations().stream()
				.map(l -> mapping.getLocationDemandMapping(l.getObjectId()))
				.collect(Collectors.toList());

		return NetworkDemandSummaryImpl
				.build()
				.add(DemandTypeEnum.planned_demand, SpeedCategory.cat7,
						dc.getLocationDemand())

				.add(DemandTypeEnum.new_demand,
						SpeedCategory.cat7,
						aroDemandService.aggregateDemandForSpeedCategory(
								mapping.getAllDemandMapping(),
								SpeedCategory.cat7))

				.add(DemandTypeEnum.original_demand,
						SpeedCategory.cat3,
						aroDemandService.aggregateDemandForSpeedCategory(
								plannedDemand, SpeedCategory.cat3))

				.build();

	}

	private List<Number> createAllServiceAreaUpdates(ServiceLayer serviceLayer,
			MasterOptimizationRequest request) {
		return networkPlanRepository.computeWirecenterUpdates(request
				.getPlanId(), StreamUtil.map(serviceAreaAnalyzer
				.computeServiceAreas(serviceLayer.getId(),
						request.getWireCenters()), ServiceArea::getId));
	}

	private List<Number> createSelectedAreaUpdates(ServiceLayer serviceLayer,
			MasterOptimizationRequest request) {
		return networkPlanRepository.computeWirecenterUpdates(
				request.getPlanId(), serviceLayer.getId());
	}

	private ProcessLayerCommand computeWireCenterRequests(
			ServiceLayer serviceLayer, MasterOptimizationRequest request) {

		final LocationSelectionMode selectionMode = request
				.getNetworkDataRequest().getSelectionMode();

		boolean selectAllLocations = selectionMode == LocationSelectionMode.ALL_LOCATIONS;

		List<Number> wireCentersPlans = (selectAllLocations) ? createAllServiceAreaUpdates(
				serviceLayer, request) : createSelectedAreaUpdates(
				serviceLayer, request);

		Collection<WirecenterOptimizationRequest> cmds = StreamUtil.map(
				wireCentersPlans,
				id -> {
					return new WirecenterOptimizationRequest(request
							.getOptimizationConstraints(), request
							.getConstraints(), request.getNetworkDataRequest()
							.createRequest(id.longValue(), selectionMode),
							request.getAlgorithmType());
				});

		return new ProcessLayerCommandImpl(serviceLayer, cmds);
	}

	private Collection<Integer> toIds(List<AnalysisSelection> selections) {
		return StreamUtil.map(selections, AnalysisSelection::getSpatialId);
	}

	private class ServiceAreaAnalyzer {

		private Collection<ServiceArea> processAnalysisAreas(
				int serviceLayerId, List<AnalysisSelection> selections) {
			Map<Integer, List<AnalysisArea>> map = analysisAreaRepository
					.findAll(toIds(selections))
					.stream()
					.collect(
							Collectors.groupingBy(a -> a.getAnalysisLayer()
									.getId()));
			return map
					.entrySet()
					.stream()
					.map(e -> serviceAreaRepository
							.queryServiceAreasforForAnalysis(StreamUtil.map(
									e.getValue(), AnalysisArea::getId),
									serviceLayerId, e.getKey()))
					.flatMap(Collection::stream).collect(Collectors.toSet());
		}

		private Collection<ServiceArea> processSuperLayers(int serviceLayerId,
				List<AnalysisSelection> selections) {

			Map<Integer, List<SuperServiceArea>> map = superServiceAreaRepository
					.findAll(toIds(selections)).stream()
					.collect(Collectors.groupingBy(a -> a.getLayer().getId()));

			return map
					.entrySet()
					.stream()
					.map(e -> serviceAreaRepository
							.queryServiceAreasFromSuperServiceAreas(
									StreamUtil.map(e.getValue(),
											SuperServiceArea::getId),
									serviceLayerId, e.getKey()))

					.flatMap(Collection::stream).collect(Collectors.toSet());
		}

		public Collection<ServiceArea> processServiceAreas(
				List<AnalysisSelection> selections) {
			return serviceAreaRepository.findAll(toIds(selections));
		}

		public Collection<ServiceArea> computeServiceAreas(int processLayerId,
				SpatialAnalysisType regionType,
				List<AnalysisSelection> selections) {

			switch (regionType) {
			case WIRECENTER:
				return processServiceAreas(selections);
			case ANALYSIS_AREA:
				return processAnalysisAreas(processLayerId, selections);
			case SUPER_SERVICE_AREA:
				return processSuperLayers(processLayerId, selections);
			default:
				return Collections.emptyList();
			}

		}

		public Set<ServiceArea> computeServiceAreas(int processLayerId,
				Collection<AnalysisSelection> selections) {

			Map<SpatialAnalysisType, List<AnalysisSelection>> mappedSelections = selections
					.stream()
					.collect(
							Collectors
									.groupingBy(AnalysisSelection::getSpatialRegionType));

			return mappedSelections
					.entrySet()
					.stream()
					.map(e -> this.computeServiceAreas(processLayerId,
							e.getKey(), e.getValue()))
					.flatMap(Collection::stream).collect(Collectors.toSet());

		}
	}

	private static class ProcessLayerCommandImpl implements ProcessLayerCommand {

		private ServiceLayer serviceLayer;
		private Collection<WirecenterOptimizationRequest> commands;

		public ProcessLayerCommandImpl(ServiceLayer serviceLayer,
				Collection<WirecenterOptimizationRequest> commands) {
			super();
			this.serviceLayer = serviceLayer;
			this.commands = commands;
		}

		@Override
		public ServiceLayer getServiceLayer() {
			return serviceLayer;
		}

		@Override
		public Collection<WirecenterOptimizationRequest> getServiceAreaCommands() {
			return commands;
		}

	}

}
