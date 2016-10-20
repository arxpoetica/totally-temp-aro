package com.altvil.aro.service.plan;

import java.util.Collection;
import java.util.Collections;
import java.util.Set;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.NetworkAssignmentModel;

public class DefaultNetworkAssignmentModel implements NetworkAssignmentModel {
	private final Set<NetworkAssignment> knownLocations;
	private final Set<NetworkAssignment> selectedTargets;
	
	 DefaultNetworkAssignmentModel(Set<NetworkAssignment> knownLocations, Set<NetworkAssignment> selectedTargets) {
		this.knownLocations = Collections.unmodifiableSet(knownLocations);
		this.selectedTargets = Collections.unmodifiableSet(selectedTargets);
	}

	public Collection<NetworkAssignment> getAssignments() {
		return knownLocations;
	}

	public Collection<NetworkAssignment> getSelectedAssignments() {
		return selectedTargets;
	}

}
