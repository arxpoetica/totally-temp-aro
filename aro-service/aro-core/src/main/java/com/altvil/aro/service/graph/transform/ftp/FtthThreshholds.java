package com.altvil.aro.service.graph.transform.ftp;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.utils.UnitUtils;

public class FtthThreshholds {

	private boolean reduceIncomingStreams = false;
	private int maxlocationPerFDT = 12;
	private int threshHoldClusteringFDT = 10;
	private HubModel hubModel;
	private DropCableModel dropCableModel = DropCableModel.DEFAULT_MODEL;
	private double locationBulkThreshhold = 24 ;
	private double maxOffsetInMeters = UnitUtils.toMeters(60000);
	private double maxDropCableLengthInMeters = UnitUtils.toMeters(1500);
	private double preferredDropCableLengthInMeters = UnitUtils.toMeters(400);
	private double sparseThreshholdInMeters = 1 / UnitUtils.toMeters(500); // Sparse
	private boolean clusterMergingSupported = false;
	private boolean dropCableConstraintsSupported = true;

	private FtthThreshholds() {

	}

	// if
	// <
	// 1/500
	// feet

	public static Builder build() {
		return new Builder();
	}

	public double getLocationBulkThreshhold() {
		return locationBulkThreshhold;
	}

	public DropCableModel getDropCableModel() {
		return dropCableModel;
	}

	public boolean isReduceIncomingStreams() {
		return reduceIncomingStreams;
	}

	public int getMaxlocationPerFDT() {
		return maxlocationPerFDT;
	}

	public int getMinLocationPerFDH() {
		return hubModel.getMinHhount();
	}

	public int getLocationPerFDH() {
		return hubModel.getIdealHhCount();
	}

	public int getMaxLocationPerFDH() {
		return hubModel.getMaxHhCount();
	}

	public double getMaxOffsetInMeters() {
		return maxOffsetInMeters;
	}

	public double getSparseThreshholdInMetersPerHH() {
		return sparseThreshholdInMeters;
	}

	public int getThreshHoldClusteringFDT() {
		return threshHoldClusteringFDT;
	}

	public double getMaxDropCableLengthInMeters() {
		return maxDropCableLengthInMeters;
	}

	public HubModel getHubModel() {
		return hubModel;
	}

	public double getPreferredDropCableLengthInMeters() {
		return preferredDropCableLengthInMeters;
	}

	public boolean isClusterMergingSupported() {
		return clusterMergingSupported;
	}

	public boolean isDropCableConstraintsSupported() {
		return dropCableConstraintsSupported;
	}

	public String toString() {
		return ToStringBuilder.reflectionToString(this);
	}

	public static class Builder {

		private FtthThreshholds thresholds = new FtthThreshholds();

		private int splitterRatio = 32;

		private int minSplitters = 6;
		private int idealSplitters = 26;
		private int maxSplitters = 32;

		public Builder setFdtCount(Integer count) {
			if (count != null) {
				thresholds.maxlocationPerFDT = count;
				thresholds.threshHoldClusteringFDT = count - 2;
			}
			return this;
		}

		public Builder setSplitterRatio(Integer count) {
			if (count != null) {
				this.splitterRatio = count;
			}
			return this;
		}

		public Builder setMinSplitters(Integer count) {
			if (count != null) {
				this.minSplitters = count;
			}
			return this;
		}

		public Builder setIdealSplitters(Integer count) {
			if (count != null) {
				this.idealSplitters = count;
			}
			return this;
		}

		public Builder setMaxSplitters(Integer count) {
			if (count != null) {
				this.maxSplitters = count;
			}
			return this;
		}

		public Builder setPrefferedOffsetInFeet(Double feet) {
			if (feet != null) {
				thresholds.preferredDropCableLengthInMeters = UnitUtils
						.toMeters(feet);
			}
			return this;
		}

		public Builder setMaxOffsetInFeet(Double feet) {
			if (feet != null) {
				thresholds.maxOffsetInMeters = UnitUtils.toMeters(feet);
			}
			return this;
		}

		public Builder setDropCableInFeet(Double feet) {
			if (feet != null) {
				thresholds.maxDropCableLengthInMeters = UnitUtils
						.toMeters(feet);
			}
			return this;
		}

		public Builder setClusterMergingSupported(
				Boolean clusterMergingSupported) {
			if (clusterMergingSupported != null) {
				thresholds.clusterMergingSupported = clusterMergingSupported;
			}
			return this;
		}

		public Builder setDropCableConstraintsSupported(
				Boolean dropCableConstraintsSupported) {
			if (dropCableConstraintsSupported != null) {
				thresholds.dropCableConstraintsSupported = dropCableConstraintsSupported;
			}
			return this;
		}

		// TODO validate inputs
		public FtthThreshholds build() {

			thresholds.hubModel = HubModel.create(splitterRatio, minSplitters,
					idealSplitters, maxSplitters);

			return thresholds;
		}

	}

}
