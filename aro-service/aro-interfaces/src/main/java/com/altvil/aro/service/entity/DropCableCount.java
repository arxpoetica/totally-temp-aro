package com.altvil.aro.service.entity;

public class DropCableCount {

	private DropCable dropCable;
	private double count;

	public DropCableCount() {
	}
	
	public DropCableCount(DropCable dropCable, double count) {
		super();
		this.dropCable = dropCable;
		this.count = count;
	}

	public DropCable getDropCable() {
		return dropCable;
	}

	public void setDropCable(DropCable dropCable) {
		this.dropCable = dropCable;
	}

	public double getCount() {
		return count;
	}

	public void setCount(double count) {
		this.count = count;
	}

}
