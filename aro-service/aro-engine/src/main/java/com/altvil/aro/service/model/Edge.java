package com.altvil.aro.service.model;

public interface Edge {
	public String getBuffer();

	public String getCounty() ;

	public double getEdgeLength();

	public String getGeog();

	public String getGeom() ;

	public int getId();

	public String getState();

	public long getTlid();

	public long getTnidf();

	public long getTnidt();

	public Edge setBuffer(String buffer);

	public Edge setCounty(String county);

	public Edge setEdgeLength(double edgeLength);

	public Edge setGeog(String geog);

	public Edge setGeom(String geom);

	public Edge setId(int id);

	public Edge setState(String state);

	public Edge setTlid(long tlid);

	public Edge setTnidf(long tnidf);

	public Edge setTnidt(long tnidt);
}
