package com.altvil.aro.service.demand;

import java.util.Collection;
import java.util.EnumSet;
import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;

public class LocationTypeMask {
	
	public static final LocationTypeMask MASK = new LocationTypeMask();

	private Set<LocationEntityType> fullMask = EnumSet
			.allOf(LocationEntityType.class);

	private LocationTypeMask() {
	}
	
	public Set<LocationEntityType> asMask(Collection<String> mask) {
		if (mask == null || mask.isEmpty()) {
			return fullMask;
		}
		
		Set<LocationEntityType> setMask =  EnumSet.noneOf(LocationEntityType.class) ;
		mask.forEach(s -> {
			LocationEntityType lt = LocationEntityType.valueOf(s) ;
			if( lt != null ) {
				setMask.add(lt) ;
			}
		});
		return setMask ;
	}

	public Set<LocationEntityType> toMask(Collection<LocationEntityType> mask) {
		if (mask == null || mask.isEmpty()) {
			return fullMask;
		}
		
		Set<LocationEntityType> setMask =  EnumSet.noneOf(LocationEntityType.class) ;
		setMask.addAll(mask) ;
		return setMask ;
	}
	
	public Set<LocationEntityType> toMask(Set<LocationEntityType> mask) {
		if (mask == null || mask.isEmpty()) {
			return fullMask;
		}
		
		return mask;
	}


}
