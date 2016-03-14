package com.altvil.aro.service.network;

public class NetworkRequest {
	
	public static NetworkRequest create(long planId) {
		NetworkRequest request = new NetworkRequest() ;
		request.setPlanId(planId) ;
		return request ;
	}
	
	private long planId ;
	private int year = 2015 ;

	public NetworkRequest() {
	}
	
	public long getPlanId() {
		return planId;
	}


	public void setPlanId(long planId) {
		this.planId = planId;
	}

	public int getYear() {
		return year;
	}

	public void setYear(int year) {
		this.year = year;
	}
	
	

}
