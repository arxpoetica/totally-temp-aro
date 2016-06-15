package com.altvil.aro.service.roic.analysis.builder;

import com.altvil.aro.service.roic.analysis.entity.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;

public class ComponentInput {

	public static class Builder {

		private ComponentInput input;

		public Builder setNetworkPenetration(NetworkPenetration penetration) {
			input.penetration = penetration;
			return this;
		}

		public Builder setEntityCount(double entityCount) {
			input.entityCount = entityCount;
			return this;
		}

		public Builder setEntityGrowth(double growth) {
			input.entityGrowth = growth;
			return this;
		}

		public Builder setChurnRate(double churnRate) {
			input.churnRate = churnRate;
			return this;
		}

		public Builder setChurnRateDecrease(double churnRateDecrease) {
			input.churnRateDecrease = churnRateDecrease;
			return this;
		}

		public Builder setOpexPercent(double churnRateDecrease) {
			input.churnRateDecrease = churnRateDecrease;
			return this;
		}

		public Builder setArpu(double arpu) {
			input.arpu = arpu;
			return this;
		}

	}

	private ComponentType componentType;
	private NetworkPenetration penetration;
	private double entityCount = 1;
	private double entityGrowth = 0;
	private double churnRate = 0;
	private double churnRateDecrease = 0;
	private double opexPercent;
	private double arpu;
	private double premisesCount;

	public ComponentType getComponentType() {
		return componentType;
	}

	public NetworkPenetration getPenetration() {
		return penetration;
	}

	public double getEntityCount() {
		return entityCount;
	}

	public double getEntityGrowth() {
		return entityGrowth;
	}

	public double getChurnRate() {
		return churnRate;
	}

	public double getChurnRateDecrease() {
		return churnRateDecrease;
	}

	public double getOpexPercent() {
		return opexPercent;
	}

	public double getArpu() {
		return arpu;
	}

	public double getPremisesCount() {
		return premisesCount;
	}

}
