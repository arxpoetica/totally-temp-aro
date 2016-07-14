package com.altvil.aro.service.conversion;

import java.util.Collection;
import java.util.Collections;

import com.altvil.aro.service.conversion.impl.NetworkNodeAssembler;
import com.altvil.aro.service.entity.AssignedEntityDemand;
import com.altvil.aro.service.entity.DemandStatistic;

public class MappedBftAssignment implements EquipmentLocationMapping {

	private NetworkNodeAssembler nodeAssembler;
	private AssignedEntityDemand assignedDemand;

	public MappedBftAssignment(NetworkNodeAssembler nodeAssembler,
			AssignedEntityDemand assignedDemand) {
		super();
		this.nodeAssembler = nodeAssembler;
		this.assignedDemand = assignedDemand;
	}

	public NetworkNodeAssembler getNodeAssembler() {
		return nodeAssembler;
	}

	public AssignedEntityDemand getAssignedDemand() {
		return assignedDemand;
	}

	@Override
	public Collection<AssignedEntityDemand> getAssignedEntityDemands() {
		return Collections.singleton(assignedDemand);
	}

	@Override
	public DemandStatistic getDemandStatistic() {
		return assignedDemand.getLocationDemand();
	}

}
