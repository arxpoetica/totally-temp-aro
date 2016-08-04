package com.altvil.aro.util.sequence;

public class LongSequenceGenerator implements SequenceGenerator<Long> {
	
	private long sequence = 1 ;
	
	
	public synchronized Long  next() {
		long val = sequence++ ;
		if( val == Long.MAX_VALUE ) {
			return val ;
		}
		
		return val ;
	}

}
