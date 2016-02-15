package com.altvil.test.recalc;

import java.util.concurrent.ExecutionException;

import org.junit.Test;

import com.altvil.aro.service.MainEntry;
import com.altvil.aro.service.plan.DefaultRecalcRequest;
import com.altvil.aro.service.recalc.RecalcException;
import com.altvil.aro.service.recalc.RecalcService;
import com.altvil.aro.service.recalc.protocol.RecalcResponse;

public class TestRecalc {

	@Test
	public void test() throws RecalcException, InterruptedException,
			ExecutionException {
		DefaultRecalcRequest request = new DefaultRecalcRequest();
		request.setPlanId(4);
		RecalcResponse response = MainEntry.service(RecalcService.class)
				.submit(request).getResponse();

		System.out.println(response.getRunningTimeInMillis());

	}

}
