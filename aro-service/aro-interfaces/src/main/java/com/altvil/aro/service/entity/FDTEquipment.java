package com.altvil.aro.service.entity;

import java.util.Collection;

public interface FDTEquipment extends EquipmentLinker {

	
	Collection<LocationDropAssignment> getDropAssignments();
	DropCableSummary getDropCableSummary() ;
	

}
