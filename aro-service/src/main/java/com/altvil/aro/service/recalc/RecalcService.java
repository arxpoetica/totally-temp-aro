package com.altvil.aro.service.recalc;

import com.altvil.aro.service.recalc.protocol.RecalcRequest;

public interface RecalcService {

	public Job submit(RecalcRequest job) throws RecalcException;

}
