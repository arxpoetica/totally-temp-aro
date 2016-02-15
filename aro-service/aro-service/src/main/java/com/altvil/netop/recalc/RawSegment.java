package com.altvil.netop.recalc;

import com.vividsolutions.jts.geom.Geometry; ;

public class RawSegment {

	private Geometry shape;
	
	public RawSegment() {
	}
	
	public RawSegment(Geometry shape) {
		super();
		this.shape = shape;
	}

	public Geometry getShape() {
		return shape;
	}

	public void setShape(Geometry shape) {
		this.shape = shape;
	}

}
