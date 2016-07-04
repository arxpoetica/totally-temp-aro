package com.altvil.test.roic;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.builder.RoicConstants;
import com.altvil.aro.service.roic.analysis.builder.network.NetworkBuilderService;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;


@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(value = "/test-config.xml")
public class RoicNetworkModelTest {

	@Autowired
	private NetworkBuilderService networkBuilderService ;

	@Before
	public void init() {
	}

	@Test
	public void testRoicNetwork() {

		AnalysisPeriod ap = new AnalysisPeriod(2016, 20);
		
		RoicInputs fiberInputs = RoicInputs.updateInputs(
				RoicConstants.FiberConstants, 120, 100000);

		RoicNetworkModel networkModel = networkBuilderService
				.build(NetworkAnalysisType.fiber)
				.setAnalysisPeriod(ap)
				.set(fiberInputs)
				.setNetworkAnalysisType(NetworkAnalysisType.fiber)
				.build() ;
		
		Assert.assertTrue(networkModel !=null); ;

	}



}
