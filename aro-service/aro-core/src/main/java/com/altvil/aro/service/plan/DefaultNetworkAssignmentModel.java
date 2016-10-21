package com.altvil.aro.service.plan;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.NetworkAssignmentModel;

public class DefaultNetworkAssignmentModel implements NetworkAssignmentModel {

	private final Map<SelectionFilter, Collection<NetworkAssignment>> map;

	public DefaultNetworkAssignmentModel(Map<SelectionFilter, Collection<NetworkAssignment>> assignmentMap ) {
		this.map = assignmentMap;
	}


	@Override
	public Collection<NetworkAssignment> getAssignments(SelectionFilter selectionFilter) {
		return map.get(selectionFilter);
	}
}
