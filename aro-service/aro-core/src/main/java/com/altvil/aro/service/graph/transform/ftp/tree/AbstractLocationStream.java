package com.altvil.aro.service.graph.transform.ftp.tree;

public abstract class AbstractLocationStream implements LocationStream {

	private double maxDistanceToEnd;
	private int count;
	private double locationDemand;

	public AbstractLocationStream(double maxDistanceToEnd, int count,
			double locationDemand) {
		super();
		this.maxDistanceToEnd = maxDistanceToEnd;
		this.count = count;
		this.locationDemand = locationDemand;
	}

	@Override
	public double getMaxDistancetoEnd() {
		return maxDistanceToEnd;
	}

	@Override
	public int getLocationCount() {
		return count;
	}

	@Override
	public double getLocationDemand() {
		return locationDemand;
	}

}
