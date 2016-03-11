package com.altvil.aro.service.demand;

import java.util.List;

public interface EdgeDemand {
	List<AssignedEntityDemand> getFdtAssigments();

	List<AssignedEntityDemand> getBulkFiberAssigments();
}
