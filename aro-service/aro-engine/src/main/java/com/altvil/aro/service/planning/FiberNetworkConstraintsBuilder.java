package com.altvil.aro.service.planning;

import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.plan.FiberNetworkConstraints;

public interface FiberNetworkConstraintsBuilder {
	FtthThreshholds build(FiberNetworkConstraints fiberNetworkConstraints);
}
