package com.altvil.aro.service.planning;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.plan.FiberNetworkConstraints;

public class FiberConstraintUtils {
	
	public static FtthThreshholds build(FiberNetworkConstraints fiberNetworkConstraints) {
		final FtthThreshholds.Builder builder = new FtthThreshholds.Builder();
		if (fiberNetworkConstraints != null) {
			builder
			.setUseDirectRouting(fiberNetworkConstraints.getUseDirectRouting())
			.setFiberLengthConstraint(FiberType.DISTRIBUTION,
					fiberNetworkConstraints.getMaxDistributionFiberLengthMeters())
			.setFiberLengthConstraint(FiberType.FEEDER,
					fiberNetworkConstraints.getMaxFeederFiberLengthMeters()) 
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
