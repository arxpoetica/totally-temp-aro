package com.altvil.aro.service.entity;

import java.util.Collection;

public interface EquipmentLinker extends AroEntity {
	
	boolean hasDemandFor(LocationEntityType type) ;
	Collection<LocationEntity> getLocationEntities() ;
	Collection<AssignedEntityDemand> getAssignedDemands() ;

}
