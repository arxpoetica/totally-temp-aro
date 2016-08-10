package com.altvil.aro.service.demand.mapping;

import java.util.EnumMap;
import java.util.Map;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.demand.DemandMapping;
import com.altvil.aro.service.demand.analysis.spi.EntityDemandMapping;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.utils.func.Aggregator;

public class CompetitiveLocationDemandMapping implements DemandMapping,
		CompetitiveMapping {

	/**
* 
*/
	private static final long serialVersionUID = 1L;

	public static Aggregator<CompetitiveLocationDemandMapping> aggregate() {
		return new DemandMappingAggregator();
	}

	private static class DemandMappingAggregator implements
			Aggregator<CompetitiveLocationDemandMapping> {

		private Map<LocationEntityType, Aggregator<EntityDemandMapping>> map = new EnumMap<>(
				LocationEntityType.class);

		public DemandMappingAggregator() {
			for (LocationEntityType type : LocationEntityType.values()) {
				map.put(type, EntityDemandMappingImpl.aggregate());
			}
		}

		@Override
		public void add(CompetitiveLocationDemandMapping val) {
			for (LocationEntityType type : LocationEntityType.values()) {
				map.get(type).add(val.getEntityDemandMapping(type));
			}
		}

		@Override
		public CompetitiveLocationDemandMapping apply() {
			Map<LocationEntityType, EntityDemandMapping> result = new EnumMap<>(
					LocationEntityType.class);

			for (LocationEntityType t : LocationEntityType.values()) {
				result.put(t, map.get(t).apply());
			}

			// TODO Average Strength (Maybe)
			return new CompetitiveLocationDemandMapping(0, 0, result);
		}

	}

	private int blockId;
	private double competitiveStrength;

	private Map<LocationEntityType, EntityDemandMapping> map = new EnumMap<>(
			LocationEntityType.class);

	private static final EntityDemandMapping zeroDemand = new EntityDemandMappingImpl(
			0, 0);

	public CompetitiveLocationDemandMapping(int blockId, double competitiveStrength) {
		super();
		this.blockId = blockId;
		this.competitiveStrength = competitiveStrength;
	}

	@Override
	public int getCensusBlockId() {
		return blockId;
	}

	public CompetitiveLocationDemandMapping(int blockId, double competitiveStrength,
			Map<LocationEntityType, EntityDemandMapping> map) {
		this.blockId = blockId;
		this.competitiveStrength = competitiveStrength;
		this.map = map;
	}

	public double getCompetitiveStrength() {
		return competitiveStrength;
	}

	public boolean isEmpty() {
		return map.size() == 0;
	}

	public int getBlockId() {
		return blockId;
	}

	public void add(LocationEntityType type, EntityDemandMapping mapping) {
		map.put(type, mapping);
	}

	// public void addZeroDemand(LocationEntityType type) {
	// add(type, zeroDemand);
	// }

	public void add(LocationEntityType type, double demand, double revenue) {
		add(type, new EntityDemandMappingImpl(demand, revenue));
	}

	@Override
	public EntityDemandMapping getEntityDemandMapping(LocationEntityType type) {
		EntityDemandMapping edm = map.get(type);
		return edm == null ? zeroDemand : edm;
	}

	public String toString() {
		return new ToStringBuilder(this).append("competitiveStrength", competitiveStrength).append("blockId", blockId).append("map", map).build();
	}
}