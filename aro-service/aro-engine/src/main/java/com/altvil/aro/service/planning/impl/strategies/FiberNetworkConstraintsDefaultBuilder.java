package com.altvil.aro.service.planning.impl.strategies;

import com.altvil.annotation.FiberPlanDefaultStrategy;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planning.FiberNetworkConstraintsBuilder;

/*
 * NOTES: FtthThreshholds should be specific to the network owner. 
 *        We don't have an 'Owner' property right now so I'm using 
 *        FiberPlan as a placeholder. -- Kevin
 */
@FiberPlanDefaultStrategy(type = FiberNetworkConstraintsBuilder.class)
public class FiberNetworkConstraintsDefaultBuilder implements FiberNetworkConstraintsBuilder {

	@Override
	public FtthThreshholds build(FiberNetworkConstraints fiberNetworkConstraints) {
		final FtthThreshholds.Builder builder = new FtthThreshholds.Builder();
		if (fiberNetworkConstraints != null) {
			builder
			.setDropCableInFeet(fiberNetworkConstraints.getDropCableLengthInFeet())
			.setPrefferedOffsetInFeet(fiberNetworkConstraints.getPreferredCableLengthInFeet())
			.setMaxOffsetInFeet(fiberNetworkConstraints.getMaxDistrubitionLengthInFeet())
			.setMaxSplitters(fiberNetworkConstraints.getMaxSplitters())
			.setMinSplitters(fiberNetworkConstraints.getMinSplitters())
			.setIdealSplitters(fiberNetworkConstraints.getIdealSplitters())
			.setFdtCount(fiberNetworkConstraints.getFdtCount())
			.setClusterMergingSupported(fiberNetworkConstraints.getClusterMergingSupported())
			.setDropCableConstraintsSupported(
					fiberNetworkConstraints.getDropCableConstraintsSupported())
			.setSplitterRatio(fiberNetworkConstraints.getSplitterRatio());
		}
		
		return builder.build();
	}

}
