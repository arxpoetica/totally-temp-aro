package com.altvil.aro.service.network;

@Deprecated
public class NetworkRequest {
	@Deprecated
	public enum LocationLoadingRequest { ALL, SELECTED } 
	
	public static NetworkRequest create(long planId, LocationLoadingRequest loadingRequest) {
		NetworkRequest request = new NetworkRequest() ;
		request.setPlanId(planId) ;
		request.setLocationLoadingRequest(loadingRequest);
	
		return request ;
	}
	
	public static NetworkRequest create(long planId) {
		return create(planId, LocationLoadingRequest.SELECTED) ;
	}	
	
	private LocationLoadingRequest locationLoadingRequest ;
	private long planId ;
	private int year = 2015 ;

	public NetworkRequest() {
	}
	
	public long getPlanId() {
		return planId;
	}
	
	public LocationLoadingRequest getLocationLoadingRequest() {
		return locationLoadingRequest;
	}

	public void setLocationLoadingRequest(
			LocationLoadingRequest locationLoadingRequest) {
		this.locationLoadingRequest = locationLoadingRequest;
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
