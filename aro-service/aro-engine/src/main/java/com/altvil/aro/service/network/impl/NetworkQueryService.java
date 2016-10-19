package com.altvil.aro.service.network.impl;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.network.ServiceAreaContext;
import com.altvil.aro.service.network.model.ServiceAreaRoadEdges;
import com.altvil.aro.service.network.model.ServiceAreaRoadLocations;
import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadLocation;

public interface NetworkQueryService {

	public Map<Long, CompetitiveLocationDemandMapping> queryLocationDemand(
			boolean isFilteringRoadLocationDemandsBySelection,
			Set<LocationEntityType> selectedTypes, int serviceAreaId,
			long planId, int year, double mrc, ServiceAreaContext ctx, int dataSourceId);

	public ServiceAreaRoadLocations queryRoadLocations(int serviceAreaId,
			ServiceAreaContext ctx);

	public Collection<NetworkAssignment> queryFiberSources(long planId,
			ServiceAreaContext ctx);

	public ServiceAreaRoadEdges getRoadEdges(int serviceAreaId,
			ServiceAreaContext ctx);

	public List<Long> selectedRoadLocationIds(long planId,
			Map<Long, RoadLocation> roadLocationByLocationIdMap);

	public Collection<CableConduitEdge> queryPlanConditEdges(long planid);

	public Collection<CableConduitEdge> queryExistingCableConduitEdges(int serviceAreaId);

	public Collection<StateCode> getServiceAreaCodes(Integer serviceAreaId);

	public ServiceAreaContext getServiceAreaContext(Integer serviceAreaId);

}