package com.altvil.aro.service.recalc;

import com.altvil.aro.service.recalc.protocol.RecalcJob;
import com.altvil.aro.service.recalc.protocol.RecalcResponse;

public interface Job {

	public RecalcJob getJob();
	public RecalcResponse getResponse();

}
