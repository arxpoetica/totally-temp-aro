package com.altvil.aro.service.optimization.impl;

import java.util.Collection;
import java.util.Collections;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.model.ServiceArea;
import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.model.WirecenterPlan;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.persistence.repository.ServiceAreaRepository;
import com.altvil.aro.persistence.repository.WirecenterPlanRepository;
import com.altvil.aro.service.conversion.SerializationService;
import com.altvil.aro.service.demand.AroDemandService;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.aro.service.network.AnalysisSelectionMode;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.ProcessLayerCommand;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.master.OptimizedMasterPlan;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterPlanningService;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.plan.impl.CoreLeastCostRoutingServiceImpl;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.report.GeneratedPlan;
import com.altvil.utils.StreamUtil;

@Service
public class PlanCommandExecutorServiceImpl implements PlanCommandService {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(CoreLeastCostRoutingServiceImpl.class.getName());

	private NetworkPlanRepository networkPlanRepository;
	private ServiceAreaRepository serviceAreaRepository;
	private SerializationService conversionService;
	private WirecenterPlanningService wirecenterPlanningService;
	private AroDemandService aroDemandService;
	private WirecenterPlanRepository wirecenterPlanRepository;

	@Autowired
	public PlanCommandExecutorServiceImpl(
			NetworkPlanRepository networkPlanRepository,
			ServiceAreaRepository serviceAreaRepository,
			SerializationService conversionService,
			WirecenterPlanningService wirecenterPlanningService,
			AroDemandService aroDemandService, WirecenterPlanRepository wirecenterPlanRepository) {
		super();
		this.networkPlanRepository = networkPlanRepository;
		this.serviceAreaRepository = serviceAreaRepository;
		this.conversionService = conversionService;
		this.wirecenterPlanningService = wirecenterPlanningService;
		this.aroDemandService = aroDemandService;
		this.wirecenterPlanRepository = wirecenterPlanRepository;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see com.altvil.aro.service.optimization.impl.PlanCommandExectorService#
	 * deleteOldPlans(long)
	 */
	@Override
	public void deleteOldPlans(long planId) {
		networkPlanRepository.deleteChildPlans(planId);
	}

	@Override
	public void updatePlanConduit(OptimizedMasterPlan inputMasterPlan,
			NetworkDataRequest request) {
		networkPlanRepository.updateConduitInputs(inputMasterPlan.getPlanId(),
				request.getPlanId());
	}

	private Collection<ServiceArea> queryServiceAreas(long planId,
			AnalysisSelectionMode selectionMode) {
		switch (selectionMode) {
		case SELECTED_LOCATIONS:
			return serviceAreaRepository
					.querySelectedLocationServiceAreas(planId);
		default:
			return serviceAreaRepository.querySelectedServiceAreas(planId);
		}
	}

	@Override
	public ProcessLayerCommand createProcessLayerCommand(
			MasterOptimizationRequest request) {

		ServiceLayer serviceLayer = request.getProcessingLayer();
		AnalysisSelectionMode selectionMode = request.getNetworkDataRequest()
				.getSelectionMode();

		Collection<ServiceArea> serviceAreas = queryServiceAreas(
				request.getPlanId(), selectionMode);

		if (serviceAreas.isEmpty()) {
			return new ProcessLayerCommandImpl(serviceLayer,
					Collections.emptyList());
		}

		Collection<WirecenterPlan> newPlans = wirecenterPlanRepository.computeWirecenterUpdates(
				request.getPlanId(),
				StreamUtil.map(serviceAreas, ServiceArea::getId));

		ProcessLayerCommand plc = new ProcessLayerCommandImpl(serviceLayer,
				newPlans.stream()
						.map(plan -> this.createWirecenterOptimizationRequest(
								request, plan.getId(), serviceLayer, plan.getWireCenter().getId()))
						.collect(Collectors.toList()));

		// TODO Simplify Dependency
		if (selectionMode == AnalysisSelectionMode.SELECTED_LOCATIONS) {
			serviceAreaRepository.updateWireCenterPlanLocations(request
					.getPlanId());
		}

		return plc;

	}
	

	// @Override
	// public Collection<ProcessLayerCommand> createLayerCommands(
	// MasterOptimizationRequest request) {
	//
	// Collection<ProcessLayerCommand> layerCommands = serviceLayerRepository
	// .findAll(request.getProcessingLayers()).stream()
	// .map(l -> createProcessLayerCommand(request, l))
	// .filter(ProcessLayerCommand::isValid)
	// .collect(Collectors.toList());
	//
	// if (request.getNetworkDataRequest().getSelectionMode() ==
	// AnalysisSelectionMode.SELECTED_LOCATIONS) {
	// serviceAreaRepository.updateWireCenterPlanLocations(request
	// .getPlanId());
	// }
	//
	// return layerCommands;
	//
	// }

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
	public OptimizedPlan reifyPlanSummarizeAndSave(
			OptimizationConstraints constraints, PlannedNetwork plan) {

		OptimizedPlan optimizedPlan = summarize(reifyPlan(constraints, plan));
		save(optimizedPlan);
		return optimizedPlan;

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

	private WirecenterOptimizationRequest createWirecenterOptimizationRequest(
			MasterOptimizationRequest request, long planId, ServiceLayer sl, int serviceAreaId) {

		return new WirecenterOptimizationRequest(
				request.getOptimizationConstraints(),
				request.getConstraints(),
				request.getNetworkDataRequest()
						.createRequest(planId, sl.getId())
						.createRequest(serviceAreaId),
				request.getAlgorithmType(), 
				request.isUsePlanConduit(),
				request.getExtendedAttributes()
		);
	}

	// private List<Number> createSelectedAreaUpdates(ServiceLayer serviceLayer,
	// MasterOptimizationRequest request) {
	// return networkPlanRepository.computeWirecenterUpdates(
	// request.getPlanId(), serviceLayer.getId());
	// }

	// private ProcessLayerCommand computeWireCenterRequests(
	// ServiceLayer serviceLayer, MasterOptimizationRequest request) {
	//
	// final LocationSelectionMode selectionMode = request
	// .getNetworkDataRequest().getSelectionMode();
	//
	// boolean selectAllLocations = selectionMode ==
	// LocationSelectionMode.ALL_LOCATIONS;
	//
	// List<Number> wireCentersPlans = (selectAllLocations) ?
	// createAllServiceAreaUpdates(
	// serviceLayer, request) : createSelectedAreaUpdates(
	// serviceLayer, request);
	//
	// Collection<WirecenterOptimizationRequest> cmds = StreamUtil.map(
	// wireCentersPlans,
	// id -> {
	// return new WirecenterOptimizationRequest(request
	// .getOptimizationConstraints(), request
	// .getConstraints(), request.getNetworkDataRequest()
	// .createRequest(id.longValue(), selectionMode),
	// request.getAlgorithmType());
	// });
	//
	// return new ProcessLayerCommandImpl(serviceLayer, cmds);
	// }

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
		public boolean isValid() {
			return !commands.isEmpty();
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
