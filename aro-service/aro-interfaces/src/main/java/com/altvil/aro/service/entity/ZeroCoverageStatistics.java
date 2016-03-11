package com.altvil.aro.service.entity;

import java.util.Map;

import java.util.EnumMap;

public class ZeroCoverageStatistics implements LocationDemand {

	public static LocationDemand STATISTIC = new ZeroCoverageStatistics();
	
	private static Map<LocationEntityType, LocationEntityDemand> map = new EnumMap<>(LocationEntityType.class) ;
	static {
		for(LocationEntityType t : LocationEntityType.values()) {
			map.put(t, new ZeroEntityDemand(t)) ;
		}
	}
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	@Override
	public double getHouseholdFiberDemandValue() {
		return 0;
	}
	



	@Override
	public double getTotalDemand() {
		return 0;
	}




	@Override
	public LocationEntityDemand getHouseholdFiberDemand() {
		return map.get(LocationEntityType.Household) ;
	}

	@Override
	public LocationEntityDemand getLocationDemand(LocationEntityType type) {
		 return map.get(type) ;
	}

	@Override
	public LocationDemand add(LocationDemand coverageStatic) {
		return coverageStatic ;
	}
	
	private static class ZeroEntityDemand implements LocationEntityDemand {

		private LocationEntityType type ;
		
		public ZeroEntityDemand(LocationEntityType type) {
			super();
			this.type = type;
		}

		@Override
		public LocationEntityType getEntityType() {
			return type ;
		}

		@Override
		public double getDemand() {
			return 0;
		}

		@Override
		public LocationEntityDemand add(LocationEntityDemand other) {
			return other ;
		}
		
	}
	

}
