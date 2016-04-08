package com.altvil.aro.service.demand;

import java.util.List;

public interface EdgeDemand {
	List<DefaultAssignedEntityDemand> getFdtAssigments();

	List<DefaultAssignedEntityDemand> getBulkFiberAssigments();
}
