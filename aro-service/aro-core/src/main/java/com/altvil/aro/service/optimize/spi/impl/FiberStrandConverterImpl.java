package com.altvil.aro.service.optimize.spi.impl;

import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.service.AroException;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.optimize.spi.FiberStrandConverter;

public class FiberStrandConverterImpl implements FiberStrandConverter {

	private Map<FiberType, Map<FiberType, Converter>> map = new EnumMap<>(
			FiberType.class);

	public static final FiberStrandConverter CONVERTER = new FiberStrandConverterImpl() ;
	
	private interface Converter {
		double convert(double fiberStrands);
	}
	
	private FiberStrandConverterImpl() {
		init() ;
	}

	private void init() {

		for (FiberType ft : FiberType.values()) {
			map.put(ft, new EnumMap<FiberType, Converter>(FiberType.class));
		}
		
		fill() ;
		
		register(FiberType.DROP, FiberType.DISTRIBUTION, (val) -> val) ;
		register(FiberType.DISTRIBUTION, FiberType.FEEDER, (val) -> val / 32.0); //TODO KG move to config
		register(FiberType.FEEDER, FiberType.BACKBONE, (val) -> val); 
		register(FiberType.BACKBONE, FiberType.ROOT, (val) -> val); 
		

	}

	private void register(FiberType source, FiberType target,
			Converter converter) {
		map.get(source).put(target, converter);
	}

	private void fill() {
		
		Converter identity = (val) -> val ;
		Converter error = (val) -> {throw new AroException("Fiber Conversion Exception") ; };
		
		for (FiberType source : FiberType.values()) {
			for(FiberType target : FiberType.values()) {
				if( source == target ) {
					register(source, target, identity);
				} else {
					register(source, target, error) ;
				}
			}
		}
	}

	@Override
	public double convertFiberCount(FiberType source, FiberType target,
			double fiberDemand) {
		return map.get(source).get(target).convert(fiberDemand);
	}

}
