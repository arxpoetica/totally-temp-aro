package com.altvil.interfaces;

import java.util.Collection;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.entity.FiberType;

public class FiberCableConstructionTypeMapping {

	public static final FiberCableConstructionTypeMapping MAPPING = new FiberCableConstructionTypeMapping();

	private Map<FiberType, Map<CableConstructionEnum, FiberCableConstructionType>> map = new EnumMap<>(
			FiberType.class);

	private Map<String, FiberCableConstructionType> codeMap = new HashMap<>();

	private Set<FiberType> priceCodedTypes;
	
	private FiberCableConstructionTypeMapping() {
		init();
	}

	private void init() {

		priceCodedTypes = EnumSet.of(FiberType.FEEDER, FiberType.DISTRIBUTION,
				FiberType.BACKBONE);

		for (FiberType ft : priceCodedTypes) {

			Map<CableConstructionEnum, FiberCableConstructionType> constMap = new EnumMap<>(
					CableConstructionEnum.class);
			map.put(ft, constMap);
			for (CableConstructionEnum ct : CableConstructionEnum.values()) {
				if( ct.isValidCode() )  {
					FiberCableConstructionType fct = new FiberCableConstructionType(
							ft, ct);
					constMap.put(ct, fct);
					codeMap.put(fct.getCode(), fct);
				}
			}
		}
	}

	public Set<FiberType> getPriceCodedTypes() {
		return priceCodedTypes;
	}
	
	public Collection<FiberCableConstructionType> getPriceCodedCableTypes() {
		return codeMap.values() ;
	}

	public FiberCableConstructionType getFiberCableConstructionType(String code) {
		return codeMap.get(code);
	}

	public FiberCableConstructionType getFiberCableConstructionType(
			FiberType ft, CableConstructionEnum ct) {
		return map.get(ft).get(ct);
	}

}
