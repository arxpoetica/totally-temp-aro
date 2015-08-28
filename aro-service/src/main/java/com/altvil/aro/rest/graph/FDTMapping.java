package com.altvil.aro.rest.graph;

import java.util.Collection;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

@Path("fdt/plan")
public class FDTMapping {
	
	
	public static class Result {
		public Collection<String> result ;
	}

	@GET
	@Path("{planId}")
	@Produces(MediaType.APPLICATION_JSON)
	public Result getFDTMapping(@PathParam("planId") int planId) {

		Result result = new Result() ;
		
//		result.result = MainEntry.service(GraphService.class).createFTDGraphPoints(
//				planId, 12) ;
//		
	
		return result ;
	}

}
