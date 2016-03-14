package com.altvil.aro.service.network.impl;

import com.altvil.interfaces.RoadEdge;
import com.vividsolutions.jts.geom.Geometry;

public class RoadEdgeImpl implements RoadEdge {
	
	private long tlid ;
	private long tindf ;
	private long tnidt ;
	private Geometry shape ;
	private double lengthMeters ;
	
	public RoadEdgeImpl(long tlid, long tindf, long tnidt, Geometry shape,
			double lengthMeters) {
		super();
		this.tlid = tlid;
		this.tindf = tindf;
		this.tnidt = tnidt;
		this.shape = shape;
		this.lengthMeters = lengthMeters;
	}

	@Override
	public long getId() {
		return tlid ;
	}

	@Override
	public long getTindf() {
		return tindf ;
	}

	@Override
	public long getTnidt() {
		return tnidt ;
	}

	@Override
	public Geometry getShape() {
		return shape ;
	}

	@Override
	public double getLengthMeters() {
		return lengthMeters ;
	}

	@Override
	public long getTlid() {
		return tlid ;
	}
	
	

}
