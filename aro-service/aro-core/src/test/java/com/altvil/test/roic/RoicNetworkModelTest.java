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
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;
import com.altvil.aro.service.roic.penetration.impl.DefaultNetworkPenetration;

public class RoicNetworkModelTest {

	private AnalysisService analysisService;

	@Before
	public void init() {
		analysisService = new AnalysisServiceImpl();
	}

	@Test
	public void testRoicNetwork() {

		AnalysisPeriod ap = new AnalysisPeriod(2016, 20);

		RoicComponent component = analysisService
				.createComponentBuilder(NetworkType.Fiber)
				.setAnalysisPeriod(ap)
				.setComponentType(ComponentType.household)
				.setRoicModelInputs(createComponentInput()).build();

		RoicNetworkModel networkModel = analysisService
				.createNetworkAnalysisBuilder().setAnalysisPeriod(ap)
				.setFixedCosts(1000)
				.setNetworkAnalysisType(NetworkAnalysisType.undefined)
				.addRoicComponent(component).build();

		dump(networkModel, AnalysisCode.cost);
		dump(networkModel, AnalysisCode.revenue);
	}

	private void dump(RoicNetworkModel model, CurveIdentifier id) {
		System.out.println(toInfo(model.getAnalysisRow(id), id));
	}

	private String toInfo(AnalysisRow row, CurveIdentifier id) {

		StringBuffer sb = new StringBuffer();

		sb.append(id + " ---> ");

		for (int i = 0; i < row.getSize(); i++) {
			if (i > 0) {
				sb.append(",");
			}
			sb.append(row.getValue(i));
		}
		sb.append("\n");
		return sb.toString();

	}


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
