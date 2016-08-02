package com.altvil.aro.service.optimize.spi;

import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.plan.GlobalConstraint;

public interface NetworkModelBuilderFactory {

	public NetworkModelBuilder create(NetworkData networkData, ClosestFirstSurfaceBuilder closestFirstSurfaceBuilder,
			FtthThreshholds fiberConstraints, GlobalConstraint globalConstraints);

}
