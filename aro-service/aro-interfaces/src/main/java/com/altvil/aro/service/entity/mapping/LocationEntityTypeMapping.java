package com.altvil.aro.service.entity.mapping;

import java.util.EnumSet;
import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;

public class LocationEntityTypeMapping {

	public static final LocationEntityTypeMapping MAPPING = new LocationEntityTypeMapping();

	private LocationEntityType[] allTypes = LocationEntityType.values();
	private LocationEntityType[] typeMap;
	private int minType = Integer.MAX_VALUE;
	private int maxType = Integer.MIN_VALUE;
	private Set<LocationEntityType> entityTypes;

	private LocationEntityTypeMapping() {
		init();
	}

	private void init() {

		entityTypes = EnumSet.allOf(LocationEntityType.class);
		
		for (LocationEntityType type : LocationEntityType.values()) {
			minType = Math.min(minType, type.getTypeCode());
			maxType = Math.max(maxType, type.getTypeCode());
		}

		typeMap = new LocationEntityType[maxType + 1];
		for (LocationEntityType type : LocationEntityType.values()) {
			typeMap[type.getTypeCode()] = type;
		}

	}

	public LocationEntityType toLocationEntityType(int type) {
		if (type < minType || type > maxType) {
			throw new RuntimeException("Unknown type " + type);
		}
		return typeMap[type];
	}

	public LocationEntityType[] allEntityTypes() {
		return allTypes;
	}
	
	public Set<LocationEntityType> entitySet() {
		return entityTypes ;
	}

}
