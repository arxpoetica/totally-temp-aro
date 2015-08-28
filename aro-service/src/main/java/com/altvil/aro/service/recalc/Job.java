package com.altvil.aro.service.recalc;

import java.util.concurrent.Future;

import com.altvil.aro.service.recalc.protocol.RecalcJob;
import com.altvil.aro.service.recalc.protocol.RecalcResponse;

public interface Job {

	public RecalcJob getJob();

	public Future<RecalcResponse> getFutureResponse();

}
