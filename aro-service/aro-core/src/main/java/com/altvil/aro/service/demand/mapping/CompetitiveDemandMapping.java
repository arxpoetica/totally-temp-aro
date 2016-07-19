package com.altvil.aro.service.demand.mapping;

import java.io.Serializable;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class CompetitiveDemandMapping implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private Map<Long, CompetitiveLocationDemandMapping> demandMapping;

	public CompetitiveDemandMapping(
			Map<Long, CompetitiveLocationDemandMapping> demandMapping) {
		super();
		this.demandMapping = demandMapping;
	}

	public Set<Long> getSelectedLocationIds() {
		return demandMapping.keySet();
	}

	public CompetitiveLocationDemandMapping getLocationDemandMapping(
			Long locationId) {
		return demandMapping.get(locationId);
	}
	
	public Collection<CompetitiveLocationDemandMapping> getAllDemandMapping() {
		return demandMapping.values() ;
	}

	public Collection<CompetitiveLocationDemandMapping> filterDemand(
			Set<Long> locationIds) {
		return locationIds.stream().map(demandMapping::get).filter(m -> m != null)
				.collect(Collectors.toList());
	}

}
