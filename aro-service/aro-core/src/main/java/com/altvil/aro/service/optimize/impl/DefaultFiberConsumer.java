package com.altvil.aro.service.optimize.impl;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;

public class DefaultFiberConsumer implements FiberConsumer {
	
	
	public static Builder build() {
		return new Builder() ;
	}
	
	public static class Builder {
		private EnumMap<FiberType, DoubleSummer> map = new EnumMap<>(FiberType.class) ;
		
		private Builder() {
			for(FiberType ft : FiberType.values()) {
				map.put(ft, new DoubleSummer()) ;
			}
		}
		
		public Builder add(FiberType fiberType, double count) {
			map.get(fiberType).add(count) ;
			return this ;
		}
		
		public Builder add(FiberProducer fiberProducer) {
			map.get(fiberProducer.getFiberType()).add(fiberProducer.getFiberCount()) ;
			return this ;
		}
		
		public FiberConsumer build() {
			return new DefaultFiberConsumer(map, computeFiberTypes()) ;
		}
		
		private Set<FiberType> computeFiberTypes() {
			EnumSet<FiberType> set =  EnumSet.noneOf(FiberType.class) ;
			for(FiberType ft : FiberType.values()) {
				if( map.get(ft).get() > 0 ) {
					set.add(ft) ;
				}
			}
			return set ;
		};
		
	}
	
	private final Map<FiberType, DoubleSummer> map ;
	private final Set<FiberType> set ;
	
	private DefaultFiberConsumer(Map<FiberType, DoubleSummer> map,
			Set<FiberType> set) {
		super();
		this.map = map;
		this.set = set;
	}


	@Override
	public Set<FiberType> getFiberTypes() {
		return set ;
	}

	
	@Override
	public double getCount(FiberType fiberType) {
		return map.get(fiberType).get() ;
	}
	
	private static class DoubleSummer {
		
		private double value = 0 ;
		
		public double get() {
			return value ;
		}
		
		public void add(double val) {
			this.value += val ;
		}
		
	}

}
