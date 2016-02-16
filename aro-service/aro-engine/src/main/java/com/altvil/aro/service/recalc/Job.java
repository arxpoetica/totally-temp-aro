package com.altvil.aro.service.recalc;

import com.altvil.aro.service.recalc.protocol.RecalcJob;
import com.altvil.aro.service.recalc.protocol.RecalcResponse;

public interface Job<T> {

	public RecalcJob getJob();
	public RecalcResponse<T> getResponse();
	public void cancel() ;

}
