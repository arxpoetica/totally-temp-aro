package com.altvil.aro.service.plan;

import java.util.Collection;
import java.util.Map;

import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.NetworkAssignmentModel;

public class DefaultNetworkAssignmentModel implements NetworkAssignmentModel {

	private final Map<SelectionFilter, Collection<NetworkAssignment>> map;
	private SelectionFilter defaultFilter;

	public DefaultNetworkAssignmentModel(
			Map<SelectionFilter, Collection<NetworkAssignment>> map,
			SelectionFilter defaultFilter) {
		super();
		this.map = map;
		this.defaultFilter = defaultFilter;
	}

	@Override
	public Collection<NetworkAssignment> getAssignments(
			SelectionFilter selectionFilter) {
		return map.get(selectionFilter);
	}

	@Override
	public Collection<NetworkAssignment> getDefaultAssignments() {
		return map.get(defaultFilter);
	}

	@Override
	public NetworkAssignmentModel create(SelectionFilter defaultFilter) {
		return new DefaultNetworkAssignmentModel(map, defaultFilter);
	}
}
