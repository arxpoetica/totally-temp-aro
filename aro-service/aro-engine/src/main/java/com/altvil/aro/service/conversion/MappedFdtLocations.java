package com.altvil.aro.service.conversion;

import java.util.Collection;

import com.altvil.aro.service.conversion.impl.NetworkNodeAssembler;
import com.altvil.aro.service.entity.AssignedEntityDemand;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.LocationDropAssignment;
import com.altvil.utils.StreamUtil;

public class MappedFdtLocations implements EquipmentLocationMapping {

	private DemandStatistic demandStatistic ;
	private NetworkNodeAssembler nodeAssembler;
	private Collection<LocationDropAssignment> mappedLocations;

	public MappedFdtLocations(NetworkNodeAssembler nodeAssembler,
			Collection<LocationDropAssignment> mappedLocations,
			DemandStatistic demandStatistic) {
		super();
		this.nodeAssembler = nodeAssembler;
		this.mappedLocations = mappedLocations;
		this.demandStatistic = demandStatistic ;
	}

	public NetworkNodeAssembler getNodeAssembler() {
		return nodeAssembler;
	}

	public Collection<LocationDropAssignment> getDropAssignments() {
		return mappedLocations;
	}
	
	@Override
	public DemandStatistic getDemandStatistic() {
		return demandStatistic ;
	}

	@Override
	public Collection<AssignedEntityDemand> getAssignedEntityDemands() {
		return StreamUtil.map(mappedLocations,
				LocationDropAssignment::getAssignedEntityDemand);
	}

}
