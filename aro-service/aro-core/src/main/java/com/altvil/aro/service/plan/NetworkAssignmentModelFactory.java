package com.altvil.aro.service.plan;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;

import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.NetworkAssignmentModel;

public class NetworkAssignmentModelFactory implements NetworkAssignmentModel.Builder {
	@SuppressWarnings("unused")
	private final Set<NetworkAssignment> allAssignments = new HashSet<>();
	@SuppressWarnings("unused")
	private Set<NetworkAssignment> selectedAssignments = new HashSet<>();
	
	public NetworkAssignmentModelFactory() {
	}
	
	public NetworkAssignmentModelFactory(NetworkAssignmentModel model,
			Predicate<? super NetworkAssignment> thoseRetained) {
		//model.getAssignments(NetworkAssignmentModel.SelectionFilter.ALL).stream().filter(thoseRetained).forEach(allAssignments::add);
		//model.getAssignments(NetworkAssignmentModel.SelectionFilter.SELECTED).stream().filter(thoseRetained).forEach(selectedAssignments::add);
	}
	
	@Override
	public void add(NetworkAssignment networkAssignment, boolean selected) {
//		if (selected)
//			selectedAssignments.add(networkAssignment);
//		allAssignments.add(networkAssignment);
		
		throw new UnsupportedOperationException("Talk to Kamil") ;
		
	}

	@Override
	public NetworkAssignmentModel build() {
		Map<NetworkAssignmentModel.SelectionFilter, Collection<NetworkAssignment>> map = new HashMap<>();
		return new DefaultNetworkAssignmentModel(map, null);
	}

}
