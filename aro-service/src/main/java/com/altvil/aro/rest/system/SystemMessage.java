package com.altvil.aro.rest.system;

import javax.ws.rs.GET;
import javax.ws.rs.Path;


@Path("system-message")
public class SystemMessage {
	
	@GET
	public String status() {
		try {

 			return "Example of Rest End Point " ;			
			
		} catch( Throwable err) {
			err.printStackTrace(); 
		}
		
		return "ARO-CORE ";
	}

}
