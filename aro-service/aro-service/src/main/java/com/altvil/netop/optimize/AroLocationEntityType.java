package com.altvil.netop.optimize;

import java.util.EnumSet;
import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;

public enum AroLocationEntityType {

	SmallBusiness(LocationEntityType.SmallBusiness), MediumBusiness(
			LocationEntityType.MediumBusiness), LargeBusiness(
			LocationEntityType.LargeBusiness), Household(
			LocationEntityType.Household), CellTower(
			LocationEntityType.CellTower), Business(
			LocationEntityType.SmallBusiness,
			LocationEntityType.MediumBusiness, LocationEntityType.LargeBusiness);
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