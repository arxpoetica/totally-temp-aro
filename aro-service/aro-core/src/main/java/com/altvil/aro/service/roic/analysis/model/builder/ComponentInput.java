package com.altvil.aro.service.roic.analysis.model.builder;

import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;

public class ComponentInput {

	public static class Builder {

		private ComponentInput input;

		public Builder(ComponentInput input) {
			super();
			this.input = input;
		}

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

		public Builder setOpexPercent(double opexPercent) {
			input.opexPercent = opexPercent;
			return this;
		}

		public Builder setArpu(double arpu) {
			input.arpu = arpu;
			return this;
		}
		
		public Builder setConnectionCost(double cost) {
			this.input.connectionCost = cost;
			return this;
		}
		
		public Builder setMaintenanceExpenses(double cost) {
			this.input.maintenanceExpenses = cost;
			return this;
		}
		
		public Builder setComponentType(ComponentType ct) {
			input.componentType = ct ;
			return this ;
		}
		
		public ComponentInput assemble() {
			if( input.componentType == null ) {
				throw new NullPointerException() ;
			}
			return input ;
		}

	}

	public static Builder build() {
		return build(new ComponentInput());
	}

	private static Builder build(ComponentInput input) {
		return new Builder(input);
	}

	private ComponentType componentType;
	private NetworkPenetration penetration;
	private double entityCount = 1;
	private double entityGrowth = 0;
	private double churnRate = 0;
	private double churnRateDecrease = 0;
	private double opexPercent;
	private double maintenanceExpenses ;
	private double arpu;
	private double premisesCount;
	private double connectionCost ;

	public ComponentType getComponentType() {
		return componentType;
	}

	public NetworkPenetration getPenetration() {
		return penetration;
	}

	public double getConnectionCost() {
		return connectionCost;
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
	

	

	public double getMaintenancePercent() {
		return maintenanceExpenses;
	}

	public Builder clone() {
		ComponentInput m = new ComponentInput();

		m.arpu = arpu;
		m.churnRate = churnRate;
		m.churnRateDecrease = churnRateDecrease;
		m.componentType = componentType;
		m.entityCount = entityCount;
		m.entityGrowth = entityGrowth;
		m.opexPercent = opexPercent;
		m.premisesCount = premisesCount;
		m.penetration = penetration;
		m.connectionCost = connectionCost ;
		m.maintenanceExpenses = maintenanceExpenses ;

		return build(m);

	}

}
