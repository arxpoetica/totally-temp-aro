package com.altvil.aro.service.network;

public class NetworkRequest {
	
	public static NetworkRequest create(int planId) {
		NetworkRequest request = new NetworkRequest() ;
		request.setPlanId(planId) ;
		return request ;
	}
	
	private int planId ;

	public NetworkRequest() {
	}
	
	public int getPlanId() {
		return planId;
	}


	public void setPlanId(int planId) {
		this.planId = planId;
	}

}
