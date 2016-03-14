package com.altvil.aro.service.graph.transform.ftp;

import java.util.ArrayList;
import java.util.Collection;

import com.altvil.aro.service.demand.AssignedEntityDemand;

public class EdgeDemand {

	public static final EdgeDemand ZERO_DEMAND = new EdgeDemand(
			new ArrayList<>());

	private Collection<AssignedEntityDemand> assignedDemands;

	public EdgeDemand(Collection<AssignedEntityDemand> assignedDemands) {
		super();
		this.assignedDemands = assignedDemands;
	}

	public Collection<AssignedEntityDemand> getAssignedDemands() {
		return assignedDemands;
	}

}
