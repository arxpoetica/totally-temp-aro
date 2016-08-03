package com.altvil.aro.service.demand.mapping;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.demand.analysis.spi.EntityDemandMapping;
import com.altvil.utils.func.Aggregator;

@SuppressWarnings("serial")
public class EntityDemandMappingImpl  implements EntityDemandMapping {

	public static Aggregator<EntityDemandMapping> aggregate() {
		return new EntityDemandMappingAggregator();
	}

	public static class EntityDemandMappingAggregator implements
			Aggregator<EntityDemandMapping> {

		private EntityDemandMappingImpl demandMapping = new EntityDemandMappingImpl(
				0, 0);

		@Override
		public void add(EntityDemandMapping val) {
			demandMapping.demand += val.getMappedDemand();
			demandMapping.revenue += val.getMappedRevenue();
		}

		@Override
		public EntityDemandMapping apply() {
			return demandMapping;
		}

	}

	private double demand;
	private double revenue;

	public EntityDemandMappingImpl(double demand, double revenue) {
		super();
		this.demand = demand;
		this.revenue = revenue;
	}

	@Override
	public double getMappedDemand() {
		return demand;
	}

	@Override
	public double getMappedRevenue() {
		return revenue;
	}

	public String toString() {
		return new ToStringBuilder(this).append("demand", demand).append("revenue", revenue).build();
	}

}