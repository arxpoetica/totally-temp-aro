package com.altvil.aro.service.optimization.impl;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.altvil.aro.model.ServiceArea;
import com.altvil.aro.model.WireCenter;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.persistence.repository.ServiceAreaRepository;
import com.altvil.aro.service.network.LocationSelectionMode;
import com.altvil.aro.service.optimization.spatial.SpatialRegionType;
import com.altvil.aro.service.optimization.spatial.SpatialSelection;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.utils.StreamUtil;

public class PlanCommands {

	private NetworkPlanRepository networkPlanRepository;
	private ServiceAreaRepository serviceAreaRepository;

	public void deleteOldPlans(long planId) {
		networkPlanRepository.deleteWireCenterPlans(planId);
	}

	private Collection<Integer> computeWirecenters(
			Collection<SpatialSelection> selections) {

		Map<SpatialRegionType, List<SpatialSelection>> mappedSelections = selections
				.stream()
				.collect(
						Collectors
								.groupingBy(SpatialSelection::getSpatialRegionType));

		return null;
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

	private class WireCenterAnalyzer {

		private Map<Integer, WireCenter> map;

		public Collection<ServiceArea> computeWireCenters(
				SpatialRegionType regionType, List<SpatialSelection> selections) {

			switch (regionType) {
			case WIRECENTER:
				return serviceAreaRepository.findAll(StreamUtil.map(selections,
						SpatialSelection::getSpatialId));
				// return StreamUtil.map(selections,
				// SpatialSelection::getSpatialId) ;
			case SUPER_SERVICE_AREA:
				return null;
			default:
				return Collections.emptyList();
			}

		}

		public Collection<WireCenter> computeWirecenters(
				Collection<SpatialSelection> selections) {

			Map<SpatialRegionType, List<SpatialSelection>> mappedSelections = selections
					.stream()
					.collect(
							Collectors
									.groupingBy(SpatialSelection::getSpatialRegionType));

			return null;
		}
	}

}
