package com.altvil.aro.service.graph.transform.ftp.cluster;


public class IncomingCluster {
	
	private double offsetMeters ;
	private LocationCluster cluster ;
	
	
	public IncomingCluster(double offsetMeters, LocationCluster cluster) {
		super();
		this.offsetMeters = offsetMeters;
		this.cluster = cluster;
	}

	public double getMaxOffsetToLocation() {
		return offsetMeters ;
	}
	
	public IncomingCluster rebranch(double distanceInMeters) {
		this.offsetMeters += distanceInMeters ;
		return this ;
	}
	
	public LocationCluster getCluster() {
		return cluster ;
	}
	
	

}
