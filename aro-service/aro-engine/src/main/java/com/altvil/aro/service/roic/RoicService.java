package com.altvil.aro.service.roic;

import com.altvil.aro.service.roic.analysis.model.RoicModel;

public interface RoicService {

	
	//Required Inputs
	
	
	//Total Count, HouseHold Count, Cost, ARPU
	
	public RoicModel getRoicModel(long planId) ;
	
	public void invalidatePlan(long planId) ;
	
}
