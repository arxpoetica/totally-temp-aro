package com.altvil.aro.service.entity;

import java.util.Collection;

public interface FDTEquipment extends AroEntity {

	
	Collection<LocationDropAssignment> getDropAssignments();
	DropCableSummary getDropCableSummary() ;
	

}
