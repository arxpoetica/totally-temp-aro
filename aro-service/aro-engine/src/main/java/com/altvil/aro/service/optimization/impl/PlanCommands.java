package com.altvil.aro.service.optimization.impl;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.altvil.aro.model.AnalysisArea;
import com.altvil.aro.model.ServiceArea;
import com.altvil.aro.model.SuperServiceArea;
import com.altvil.aro.persistence.repository.AnalysisAreaRepository;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.persistence.repository.ServiceAreaRepository;
import com.altvil.aro.persistence.repository.SuperServiceAreaRepository;
import com.altvil.aro.service.network.LocationSelectionMode;
import com.altvil.aro.service.optimization.spatial.AnalysisSelection;
import com.altvil.aro.service.optimization.spatial.SpatialAnalysisType;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.utils.StreamUtil;

public class PlanCommands {

	private NetworkPlanRepository networkPlanRepository;
	private ServiceAreaRepository serviceAreaRepository;
	private AnalysisAreaRepository analysisAreaRepository;
	private SuperServiceAreaRepository superServiceAreaRepository;

	private ServiceAreaAnalyzer serviceAreaAnalyzer;

	public void deleteOldPlans(long planId) {
		networkPlanRepository.deleteWireCenterPlans(planId);
	}

	public Collection<WirecenterOptimizationRequest> computeWireCenterRequests(
			int processLayerId, MasterOptimizationRequest request) {

		final LocationSelectionMode selectionMode = request
				.getNetworkDataRequest().getSelectionMode();

		boolean selectAllLocations = selectionMode == LocationSelectionMode.ALL_LOCATIONS;

		if (selectAllLocations) {
			StreamUtil.map(serviceAreaAnalyzer.computeServiceAreas(processLayerId,
					request.getWireCenters()), ServiceArea::getId);
		}

		List<Number> wireCentersPlans = selectAllLocations ? networkPlanRepository
				.computeWirecenterUpdates(request.getPlanId(),
						request.getWireCenters()) : networkPlanRepository
				.computeWirecenterUpdates(request.getPlanId(),
						request.getServiceLayerId());

		return StreamUtil.map(
				wireCentersPlans,
				id -> {
					return new WirecenterOptimizationRequest(request
							.getOptimizationConstraints(), request
							.getConstraints(), request.getNetworkDataRequest()
							.createRequest(id.longValue(), selectionMode));
				});
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

}
