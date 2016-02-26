package com.altvil.aro.rest;

import org.glassfish.jersey.server.ResourceConfig;

import com.altvil.aro.rest.plan.RecalcRequest;
import com.altvil.aro.rest.system.SystemStatus;

public class AroApplication extends ResourceConfig {
	
	public AroApplication() {
		register(SystemStatus.class) ;
		register(RecalcRequest.class) ;
		
		
	}

}
