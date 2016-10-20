package com.altvil.interfaces;

import java.util.Collection;

public interface NetworkAssignmentModel {
	enum SelectionFilter {
		ALL, SELECTED
	}

	interface Builder {
		void add(NetworkAssignment networkAssignment, boolean selected);
		NetworkAssignmentModel build();
	}

	Collection<NetworkAssignment> getAssignments(SelectionFilter selectionFilter);

}
