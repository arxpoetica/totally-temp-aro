package com.altvil.aro.util.function;

public class IntCounter {
	
	private int count = 0 ;
	
	public int getCount() {
		return count ;
	}
	
	public int inc() {
		return ++count ;
	}
	
	public int dec() {
		return --count ;
	}
	
	public int add(int delta) {
		count += delta ;
		return count ;
	}

}
