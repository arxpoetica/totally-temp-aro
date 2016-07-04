package com.altvil.test.roic;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.altvil.aro.service.roic.analysis.builder.component.ComponentBuilderService;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(value = "/test-config.xml")
public class RoicComponentTest {

	@Autowired
	private ComponentBuilderService componentBuilderService;

	@Before
	public void init() {
	}

	@Test
	public void testRoicComponent() {

//		AnalysisPeriod ap = new AnalysisPeriod(2016, 20);
//		RoicComponent component = componentBuilderService.build()
//				.setAnalysisPeriod(ap)
//				.setComponentType(ComponentType.household)
//				.setComponentInput(createComponentInput()).build();
//
//		dump(component, AnalysisCode.penetration);
//		dump(component, AnalysisCode.revenue);
	}
	
	
	
	
	
	

//	private void dump(RoicComponent component, CurveIdentifier id) {
//		System.out.println(toInfo(component, id));
//	}
//
//	private String toInfo(RoicComponent component, CurveIdentifier id) {
//
//		StringBuffer sb = new StringBuffer();
//
//		sb.append(id + " ---> ");
//
//		AnalysisRow row = component.getAnalysisRow(id);
//
//		for (int i = 0; i < row.getSize(); i++) {
//			if (i > 0) {
//				sb.append(",");
//			}
//			sb.append(row.getValue(i));
//		}
//		sb.append("\n");
//		return sb.toString();
//
//	}

	//
	// private RoicInputs createRoicInputs() {
	// RoicInputs ri = new RoicInputs();
	// ri.setComponentInputs(Collections.singleton(createComponentInput()));
	// ri.setFixedCost(10000);
	// ri.setType(NetworkAnalysisType.fiber);
	// return ri;
	// }
//
//	private ComponentInput createComponentInput() {
//
//		return ComponentInput.build().setArpu(100).setChurnRate(0.01)
//				.setChurnRateDecrease(0.00006).setEntityCount(150)
//				.setEntityGrowth(0.0005)
//				.setNetworkPenetration(createPenetration())
//				.setOpexPercent(0.043)
//				.setComponentType(ComponentType.household)
//				.assemble();
//	}
//
//	private NetworkPenetration createPenetration() {
//		return new DefaultNetworkPenetration(0.2, 0.6, -.03);
//	}

}
