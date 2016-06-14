package com.altvil.test.roic.penetration;

import org.junit.Assert;
import org.junit.Test;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.ResultStream;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.impl.AnalysisCurve;
import com.altvil.aro.service.roic.penetration.impl.DefaultNetworkPenetration;

public class PenetrationTest {

	@Test
	public void testPenetration() {
		StreamFunction pf = new AnalysisCurve(new DefaultNetworkPenetration(0.3,
				0.15, -0.014));

		Assert.assertEquals(0.2631434866428528, pf.calc(new CalcContext() {
			@Override
			public ResultStream getResultStream() {
				return null;
			}
			
			
			
			@Override
			public int getCurrentYear() {
				return 0;
			}



			@Override
			public int getPeriod() {
				return 20;
			}
		}), 0.0000001);
		

	}

}
