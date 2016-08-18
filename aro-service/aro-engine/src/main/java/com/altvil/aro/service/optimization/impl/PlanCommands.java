package com.altvil.aro.service.optimization.impl;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.altvil.aro.model.AnalysisArea;
import com.altvil.aro.model.AnalysisLayer;
import com.altvil.aro.model.ServiceArea;
import com.altvil.aro.model.WireCenter;
import com.altvil.aro.persistence.repository.AnalysisAreaRepository;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.persistence.repository.ServiceAreaRepository;
import com.altvil.aro.service.network.LocationSelectionMode;
import com.altvil.aro.service.optimization.spatial.SpatialAnalysisType;
import com.altvil.aro.service.optimization.spatial.AnalysisSelection;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.utils.StreamUtil;

public class PlanCommands {

	private NetworkPlanRepository networkPlanRepository;
	private ServiceAreaRepository serviceAreaRepository;
	private AnalysisAreaRepository analysisAreaRepository;

	public void deleteOldPlans(long planId) {
		networkPlanRepository.deleteWireCenterPlans(planId);
	}

	public Collection<WirecenterOptimizationRequest> computeWireCenterRequests(
			MasterOptimizationRequest request) {

		boolean selectAllLocations = !request.getWireCenters().isEmpty();

		List<Number> wireCentersPlans = selectAllLocations ? networkPlanRepository
				.computeWirecenterUpdates(request.getPlanId(),
						request.getWireCenters()) : networkPlanRepository
				.computeWirecenterUpdates(request.getPlanId(),
						request.getServiceLayerId());

		final LocationSelectionMode selectionMode = selectAllLocations ? LocationSelectionMode.ALL_LOCATIONS
				: LocationSelectionMode.SELECTED_LOCATIONS;

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

		private Map<Integer, ServiceArea> map;

		private Collection<ServiceArea> processAnalysisAreas(
				int serviceLayerId, List<AnalysisSelection> selections) {
			Map<Integer, List<AnalysisArea>> map = analysisAreaRepository
					.findAll(toIds(selections))
					.stream()
					.collect(
							Collectors.groupingBy(a -> a.getAnalysisLayer()
									.getId()));
			return map.entrySet()
					.stream()
					.map(e -> serviceAreaRepository
							.queryServiceAreasforForAnalysis(StreamUtil.map(
									e.getValue(), AnalysisArea::getId),
									serviceLayerId, e.getKey())).flatMap(Collection::stream).collect(Collectors.toSet());
		}

		public Collection<ServiceArea> computeWireCenters(
				SpatialAnalysisType regionType,
				List<AnalysisSelection> selections) {

			switch (regionType) {
			case WIRECENTER:
				return serviceAreaRepository.findAll(StreamUtil.map(selections,
						AnalysisSelection::getSpatialId));
			case ANALYSIS_AREA:
				return serviceAreaRepository
						.queryServiceAreasFromSuperServiceAreas(null, 0, 0);
			case SUPER_SERVICE_AREA:
				return null;
			default:
				return Collections.emptyList();
			}

		}

		public Collection<WireCenter> computeWirecenters(
				Collection<AnalysisSelection> selections) {

			Map<SpatialAnalysisType, List<AnalysisSelection>> mappedSelections = selections
					.stream()
					.collect(
							Collectors
									.groupingBy(AnalysisSelection::getSpatialRegionType));

			return null;
		}
	}

}
