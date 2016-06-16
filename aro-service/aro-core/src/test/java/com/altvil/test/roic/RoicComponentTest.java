package com.altvil.test.roic;

import org.junit.Before;
import org.junit.Test;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisCode;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.builder.ComponentInput;
import com.altvil.aro.service.roic.analysis.impl.AnalysisServiceImpl;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;
import com.altvil.aro.service.roic.penetration.impl.DefaultNetworkPenetration;

public class RoicComponentTest {

	private AnalysisService analysisService;

	@Before
	public void init() {
		analysisService = new AnalysisServiceImpl();
	}

	@Test
	public void testRoicComponent() {

		AnalysisPeriod ap = new AnalysisPeriod(2016, 20);
		RoicComponent component = analysisService.createComponentBuilder(NetworkType.Fiber)
				.setAnalysisPeriod(ap)
				.setComponentType(ComponentType.household)
				.setRoicModelInputs(createComponentInput()).build();
		
		dump(component, AnalysisCode.penetration) ;
		dump(component, AnalysisCode.revenue) ;
	}
	
	private void dump(RoicComponent component, CurveIdentifier id) {
		System.out.println(toInfo(component,id)) ;
	}

	private String toInfo(RoicComponent component, CurveIdentifier id) {

		
		StringBuffer sb = new StringBuffer();

		sb.append(id + " ---> ");

		AnalysisRow row = component.getAnalysisRow(id);

		for (int i = 0; i < row.getSize(); i++) {
			if (i > 0) {
				sb.append(",");
			}
			sb.append(row.getValue(i));
		}
		sb.append("\n");
		return sb.toString();

	}

	//
	// private RoicInputs createRoicInputs() {
	// RoicInputs ri = new RoicInputs();
	// ri.setComponentInputs(Collections.singleton(createComponentInput()));
	// ri.setFixedCost(10000);
	// ri.setType(NetworkAnalysisType.fiber);
	// return ri;
	// }

	private ComponentInput createComponentInput() {

		return ComponentInput.build().setArpu(100).setChurnRate(0.01)
				.setChurnRateDecrease(0.00006).setEntityCount(150)
				.setEntityGrowth(0.0005)
				.setNetworkPenetration(createPenetration())
				.setOpexPercent(0.043).assemble();
	}

	private NetworkPenetration createPenetration() {
		return new DefaultNetworkPenetration(0.2, 0.6, -.03);
	}

}
