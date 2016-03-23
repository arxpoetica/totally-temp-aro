package com.altvil.aro.service.entity;

import java.util.Map;

import java.util.EnumMap;

public class ZeroCoverageStatistics implements LocationDemand {

	public static LocationDemand STATISTIC = new ZeroCoverageStatistics();
	
	private static Map<LocationEntityType, LocationEntityDemand> map = new EnumMap<>(LocationEntityType.class) ;
	static {
		for(LocationEntityType t : LocationEntityType.values()) {
			map.put(t, new DefaultEntityDemand(t, 0)) ;
		}
	}
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	

	@Override
	public double getTotalDemand() {
		return 0;
	}
	

	@Override
	public LocationEntityDemand getLocationDemand(LocationEntityType type) {
		 return map.get(type) ;
	}

	@Override
	public LocationDemand add(LocationDemand coverageStatic) {
		return coverageStatic ;
	}
	
	private static class DefaultEntityDemand implements LocationEntityDemand {

		private LocationEntityType type ;
		private double demand ;
		
		public DefaultEntityDemand(LocationEntityType type, double demand) {
			super();
			this.type = type;
			this.demand = demand ;
		}

		@Override
		public LocationEntityType getEntityType() {
			return type ;
		}

		@Override
		public double getDemand() {
			return demand;
		}

		@Override
		public LocationEntityDemand add(LocationEntityDemand other) {
			if( other == null ) {
				return other ;
			}
			return other ;
		}

		@Override
		public LocationEntityDemand add(double other) {
			return new DefaultEntityDemand(type, demand + other) ;
		}
		
	}
	

}
