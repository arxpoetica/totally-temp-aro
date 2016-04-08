package com.altvil.aro.service.graph.transform.ftp;

import java.util.ArrayList;
import java.util.Collection;

import com.altvil.aro.service.demand.DefaultAssignedEntityDemand;

public class EdgeDemand {

	public static final EdgeDemand ZERO_DEMAND = new EdgeDemand(
			new ArrayList<>());

	private Collection<DefaultAssignedEntityDemand> assignedDemands;

	public EdgeDemand(Collection<DefaultAssignedEntityDemand> assignedDemands) {
		super();
		this.assignedDemands = assignedDemands;
	}

	public Collection<DefaultAssignedEntityDemand> getAssignedDemands() {
		return assignedDemands;
	}

}
