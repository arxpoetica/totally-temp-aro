package com.altvil.aro.service.network;

@Deprecated
public class NetworkRequest {
	@Deprecated
	public enum LocationLoadingRequest { ALL, SELECTED } 
	
	public static NetworkRequest create(PlanId planId, LocationLoadingRequest loadingRequest) {
		NetworkRequest request = new NetworkRequest() ;
		request.setPlanId(planId) ;
		request.setLocationLoadingRequest(loadingRequest);
	
		return request ;
	}
	
	public static NetworkRequest create(PlanId planId) {
		return create(planId, LocationLoadingRequest.SELECTED) ;
	}	
	
	private LocationLoadingRequest locationLoadingRequest ;
	private PlanId planId ;
	private int year = 2015 ;

	public NetworkRequest() {
	}
	
	public PlanId getPlanId$() {
		return planId;
	}
	
	public LocationLoadingRequest getLocationLoadingRequest() {
		return locationLoadingRequest;
	}

	public void setLocationLoadingRequest(
			LocationLoadingRequest locationLoadingRequest) {
		this.locationLoadingRequest = locationLoadingRequest;
	}

	public void setPlanId(PlanId planId) {
		this.planId = planId;
	}

	public int getYear() {
		return year;
	}

	public void setYear(int year) {
		this.year = year;
	}
}
