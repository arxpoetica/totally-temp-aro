package com.altvil.interfaces;

import java.util.Collection;

public interface NetworkAssignmentModel {
	interface Builder {
		void add(NetworkAssignment networkAssignment, boolean selected);
		NetworkAssignmentModel build();
	}
	
	Collection<NetworkAssignment> getAllAssignments();
	Collection<NetworkAssignment> getSelectedAssignments();
}
