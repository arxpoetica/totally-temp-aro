package com.altvil.aro.service.optimize.impl;

import java.util.Collection;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;


public class FiberProducerConsumerFactory {
	
	public static FiberProducerConsumerFactory FACTORY = new FiberProducerConsumerFactory() ;
	
	private Map<FiberType, Set<FiberType>> setMap = new EnumMap<>(FiberType.class) ;
	
	
	private FiberProducerConsumerFactory() {
		for(FiberType ft : FiberType.values()) {
			setMap.put(ft, EnumSet.of(ft)) ;
		}
	}
	
	public FiberConsumer createConsumer(FiberType fiberType, double fiberCount) {
		return new SingleFiberConsumer(setMap.get(fiberType), fiberCount) ;
	}
	
	public FiberConsumer createConsumer(Collection<FiberProducer> producers) {
		DefaultFiberConsumer.Builder b = DefaultFiberConsumer.build() ;

		producers.forEach(p -> {
			b.add(p) ;
		});
		
		return  b.build() ;
	}
	
	public FiberProducer createProducer(FiberType type, int count) {
		return new DefaultFiberProducer(type, count) ;
	}
	
	private static class SingleFiberConsumer implements FiberConsumer {

		private Set<FiberType> fiberTypes ;
		private double count ;
		
		public SingleFiberConsumer(Set<FiberType> fiberTypes, double count) {
			super();
			this.fiberTypes = fiberTypes;
			this.count = count;
		}

		@Override
		public Set<FiberType> getFiberTypes() {
			return fiberTypes ;
		}

		@Override
		public double getCount(FiberType fiberType) {
			return fiberTypes.contains(fiberType) ? count : 0 ;
		}
		
	}
	
	
}
