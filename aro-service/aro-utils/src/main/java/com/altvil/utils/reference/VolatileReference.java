package com.altvil.utils.reference;

import java.util.function.Supplier;

public class VolatileReference<T> {
	
	private Supplier<T> supplier ;
	private long timeMillis = 0 ;
	
	private long startTime ;
	private T value;
	
	public VolatileReference(Supplier<T> supplier, long timeMillis) {
		super();
		this.supplier = supplier;
		this.timeMillis = timeMillis;
	}



	public synchronized T get() {
		if( value == null || System.currentTimeMillis() - startTime > timeMillis ) {
			value = supplier.get() ;
			startTime = System.currentTimeMillis() ;
		}
		
		return value ;
	}
	

	

}
