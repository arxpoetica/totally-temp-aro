package com.altvil.aro.service.optimization.wirecenter.generated;

import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.LocationEntityType;

public interface EquipmentLinkedLocation {
	
	public enum LinkType {
		LINKED,
		FAILED,
		UNREACHABLE 
	}

	Long getLocationId();
	
	LocationEntityType getLocationEntityType() ;
	LinkType getLinkType() ;
	DemandStatistic getDemandStatistic();
	
	String getExtendedInfo();
	
}
