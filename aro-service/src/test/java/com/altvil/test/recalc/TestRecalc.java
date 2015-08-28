package com.altvil.test.recalc;

import java.util.ArrayList;
import java.util.concurrent.ExecutionException;

import org.junit.Test;

import com.altvil.aro.service.MainEntry;
import com.altvil.aro.service.recalc.RecalcException;
import com.altvil.aro.service.recalc.RecalcService;
import com.altvil.aro.service.recalc.protocol.RecalcRequest;
import com.altvil.aro.service.recalc.protocol.RecalcResponse;

public class TestRecalc {

	@Test
	public void test() throws RecalcException, InterruptedException,
			ExecutionException {
		RecalcRequest request = new RecalcRequest();
		request.setActions(new ArrayList<String>());
		request.setPlanId(4);
		RecalcResponse response = MainEntry.service(RecalcService.class)
				.submit(request).getFutureResponse().get();

		System.out.println(response.getRunningTimeInMillis());

	}

}
