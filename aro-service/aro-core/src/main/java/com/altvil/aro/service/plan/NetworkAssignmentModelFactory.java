package com.altvil.aro.service.plan;

import java.util.HashSet;
import java.util.Set;
import java.util.function.Predicate;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.NetworkAssignmentModel;

public class NetworkAssignmentModelFactory implements NetworkAssignmentModel.Builder {
	private final Set<NetworkAssignment> allAssignments = new HashSet<>();
	private Set<NetworkAssignment> selectedAssignments = allAssignments;
	
	public NetworkAssignmentModelFactory() {
	}
	
	public NetworkAssignmentModelFactory(NetworkAssignmentModel model,
			Predicate<? super NetworkAssignment> thoseRetained) {
		model.getAllAssignments().stream().filter(thoseRetained).forEach(allAssignments::add);
		model.getSelectedAssignments().stream().filter(thoseRetained).forEach(selectedAssignments::add);
	}
	
	@Override
	public void add(NetworkAssignment networkAssignment, boolean selected) {
		if (selected) {
			if (allAssignments != selectedAssignments) {
				selectedAssignments.add(networkAssignment);
			}
		} else if (allAssignments == selectedAssignments) {
			selectedAssignments = new HashSet<>(allAssignments);
		}

		allAssignments.add(networkAssignment);
	}

	@Override
	public NetworkAssignmentModel build() {
		return new DefaultNetworkAssignmentModel(allAssignments, selectedAssignments);
	}

}
