package com.altvil.aro.service.planning;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.property.PropertyConfiguration;
import com.altvil.aro.service.property.SystemPropertyEnum;

public class FiberConstraintUtils {

	public static FtthThreshholds build(
			FiberNetworkConstraints fiberNetworkConstraints,
			PropertyConfiguration propertyonConfiguration) {
		final FtthThreshholds.Builder builder = new FtthThreshholds.Builder();
		if (fiberNetworkConstraints != null) {
			builder.setUseDirectRouting(
					fiberNetworkConstraints.getUseDirectRouting())
					.setFiberLengthConstraint(
							FiberType.DISTRIBUTION,
							propertyonConfiguration
									.getSystemProperty(
											SystemPropertyEnum.max_distribution_fiber_length_meters)
									.asDouble())
					.setFiberLengthConstraint(
							FiberType.FEEDER,
							propertyonConfiguration
									.getSystemProperty(
											SystemPropertyEnum.max_feeder_fiber_length_meters)
									.asDouble())
					.setDropCableInFeet(
							fiberNetworkConstraints.getDropCableLengthInFeet())
					.setPrefferedOffsetInFeet(
							fiberNetworkConstraints
									.getPreferredCableLengthInFeet())
					.setMaxOffsetInFeet(
							fiberNetworkConstraints
									.getMaxDistrubitionLengthInFeet())
					.setMaxSplitters(fiberNetworkConstraints.getMaxSplitters())
					.setMinSplitters(fiberNetworkConstraints.getMinSplitters())
					.setIdealSplitters(
							fiberNetworkConstraints.getIdealSplitters())
					.setFdtCount(fiberNetworkConstraints.getFdtCount())
					.setClusterMergingSupported(
							fiberNetworkConstraints
									.getClusterMergingSupported())
					.setDropCableConstraintsSupported(
							fiberNetworkConstraints
									.getDropCableConstraintsSupported())
					.setSplitterRatio(
							fiberNetworkConstraints.getSplitterRatio());
		}

		return builder.build();
	}

}
