package com.altvil.interfaces;

import java.util.Collection;
import java.util.function.Predicate;

public interface NetworkAssignmentModel {
	enum SelectionFilter {
		ALL, SELECTED
	}

	interface Builder {
		void add(NetworkAssignment networkAssignment, boolean selected);
		NetworkAssignmentModel build();
	}

	Collection<NetworkAssignment> getAssignments(SelectionFilter selectionFilter);
	Collection<NetworkAssignment> getDefaultAssignments();

	NetworkAssignmentModel create(SelectionFilter defaultFilter);
	NetworkAssignmentModel filter(Predicate<NetworkAssignment> filter) ;
	
	
	//NetworkAssignmentModel op(CollectionXXXX)
	
}
