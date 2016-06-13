package com.altvil.aro.persistence.repository.model;

import com.altvil.aro.service.model.Edge;

public class EdgeImpl implements Edge {
	private int	   id;
	private long   tlid;
	private long   tnidf;
	private long   tnidt;
	private String state;
	private String county;
	private double edgeLength;
	private String geom;
	private String geog;
	private String buffer;

	@Override
	public int getId() {
		return id;
	}

	@Override
	public Edge setId(int id) {
		this.id = id;
		return this;
	}

	@Override
	public long getTlid() {
		return tlid;
	}

	@Override
	public Edge setTlid(long tlid) {
		this.tlid = tlid;
		return this;
	}

	@Override
	public long getTnidf() {
		return tnidf;
	}

	@Override
	public Edge setTnidf(long tnidf) {
		this.tnidf = tnidf;
		return this;
	}

	@Override
	public long getTnidt() {
		return tnidt;
	}

	@Override
	public Edge setTnidt(long tnidt) {
		this.tnidt = tnidt;
		return this;
	}

	@Override
	public String getState() {
		return state;
	}

	@Override
	public Edge setState(String state) {
		this.state = state;
		return this;
	}

	@Override
	public String getCounty() {
		return county;
	}

	@Override
	public Edge setCounty(String county) {
		this.county = county;
		return this;
	}

	@Override
	public double getEdgeLength() {
		return edgeLength;
	}

	@Override
	public Edge setEdgeLength(double edgeLength) {
		this.edgeLength = edgeLength;
		return this;
	}

	@Override
	public String getGeom() {
		return geom;
	}

	@Override
	public Edge setGeom(String geom) {
		this.geom = geom;
		return this;
	}

	@Override
	public String getGeog() {
		return geog;
	}

	@Override
	public Edge setGeog(String geog) {
		this.geog = geog;
		return this;
	}

	@Override
	public String getBuffer() {
		return buffer;
	}

	@Override
	public Edge setBuffer(String buffer) {
		this.buffer = buffer;
		return this;
	}
}
