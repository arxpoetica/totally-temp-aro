package com.altvil.aro.rest.system;

import javax.ws.rs.GET;
import javax.ws.rs.Path;

import com.altvil.aro.service.MainEntry;
import com.altvil.aro.service.config.ConfigService;

@Path("system-status")
public class SystemStatus {

	@GET
	public String status() {
		try {

 			return "ARO-SERVICE " + MainEntry.service(ConfigService.class).getVersion() ;			
			
		} catch( Throwable err) {
			err.printStackTrace(); 
		}
		
		return "ARO-CORE ";
	}

}
