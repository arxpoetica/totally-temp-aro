package com.altvil.aro.service.plan;

import java.util.Collection;
import java.util.EnumMap;
import java.util.Map;
import java.util.function.Predicate;

import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.NetworkAssignmentModel;
import com.altvil.utils.StreamUtil;

public class DefaultNetworkAssignmentModel implements NetworkAssignmentModel {

	private final Map<SelectionFilter, Collection<NetworkAssignment>> map;
	private final SelectionFilter defaultFilter;

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

	@Override
	public NetworkAssignmentModel filter(Predicate<NetworkAssignment> filter) {

		Map<SelectionFilter, Collection<NetworkAssignment>> map = new EnumMap<>(
				SelectionFilter.class);
		this.map.entrySet().forEach(e -> {
			map.put(e.getKey(), filterAssignments(e.getValue(), filter));
		});

		return new DefaultNetworkAssignmentModel(map, defaultFilter);
	}

	private Collection<NetworkAssignment> filterAssignments(
			Collection<NetworkAssignment> assignments,
			Predicate<NetworkAssignment> filter) {

		if (assignments == null) {
			return null;
		}

		return StreamUtil.filter(assignments, filter);

	}

}
