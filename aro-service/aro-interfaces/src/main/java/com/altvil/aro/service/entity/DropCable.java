package com.altvil.aro.service.entity;

public class DropCable implements Comparable<DropCable>{

	//Length In Meters
	private double length ;
	
	public DropCable(double length) {
		super();
		this.length = length;
	}

	public double getLength() {
		return length ;
	}

	@Override
	public int compareTo(DropCable o) {
		return Double.compare(getLength(), o.getLength()) ;
	}
	
}
