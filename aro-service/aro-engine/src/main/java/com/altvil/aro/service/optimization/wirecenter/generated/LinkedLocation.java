package com.altvil.aro.service.optimization.wirecenter.generated;

import com.altvil.aro.service.entity.AssignedEntityDemand;

public interface LinkedLocation {
	
	public enum LinkType {
		LINKED,
		FAILED,
		UNREACHABLE 
	}

	Long getLocationId();
	
	AssignedEntityDemand getAssignedEntityDemand() ;
	LinkType getLinkType() ;
	String getExtendedInfo();
	
}
