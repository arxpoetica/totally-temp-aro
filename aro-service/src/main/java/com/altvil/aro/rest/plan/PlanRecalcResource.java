package com.altvil.aro.rest.plan;

import java.util.concurrent.ExecutionException;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.altvil.aro.service.MainEntry;
import com.altvil.aro.service.plan.DefaultRecalcRequest;
import com.altvil.aro.service.recalc.RecalcException;
import com.altvil.aro.service.recalc.RecalcService;
import com.altvil.aro.service.recalc.protocol.RecalcResponse;

@Path("recalc")
public class PlanRecalcResource {

	@POST
	@Path("plan")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public RecalcResponse postRecalc(DefaultRecalcRequest request)
			throws RecalcException, InterruptedException, ExecutionException {

		return MainEntry.service(RecalcService.class).submit(request)
				.getResponse();
	}

}
