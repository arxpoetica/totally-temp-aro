package com.altvil.netop.optimize;

import java.util.EnumSet;
import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;

public enum AroLocationEntityType {

	small(LocationEntityType.small), medium(LocationEntityType.medium), large(
			LocationEntityType.large), household(LocationEntityType.small), celltower(
			LocationEntityType.celltower), business(LocationEntityType.large);

	;

	private Set<LocationEntityType> mappedTypes = EnumSet
			.noneOf(LocationEntityType.class);;

	public Set<LocationEntityType> getMappedTypes() {
		return mappedTypes;
	}

	private AroLocationEntityType(LocationEntityType... types) {
		for (LocationEntityType t : types) {
			mappedTypes.add(t);
		}
	}

}
