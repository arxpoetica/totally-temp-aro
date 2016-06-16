package com.altvil.test.roic;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.Before;
import org.junit.Test;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisCode;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.builder.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.RoicInputs;
import com.altvil.aro.service.roic.analysis.impl.AnalysisServiceImpl;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.registry.CurvePath;
import com.altvil.aro.service.roic.analysis.registry.CurveRegistry;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;
import com.altvil.aro.service.roic.penetration.impl.DefaultNetworkPenetration;

public class RoicTest {

	private AnalysisService analysisService;

	@Before
	public void init() {
		analysisService = new AnalysisServiceImpl();
	}

	@Test
	public void testRoic() {

		AnalysisPeriod ap = new AnalysisPeriod(2016, 15);

		RoicModel model = analysisService.createRoicModelBuilder()
				.setAnalysisPeriod(ap).addRoicInputs(createRoicInputs())
				.addRoicInputs(createRoicInputs())
				.addRoicInputs(createCopperRoicInputs()).build();

		RoicNetworkModel networkModel = model
				.getRoicNetworkModel(NetworkAnalysisType.planned);

		
		
		
	}

	private void dump(Map<String, AnalysisRow> map) {
		List<String> names = new ArrayList<>(map.keySet());

		for (String n : names) {
			dump(n, map.get(n));
		}

	}

	private void dump(String name, AnalysisRow row) {
		System.out.print(name);
		
		for (int i = 0; i < row.getSize(); i++) {
			System.out.print(",");
			System.out.print(row.getValue(i));
		}

		System.out.println();

	}

	private void dump(String path, CurveRegistry cr) {
		for (CurveIdentifier id : cr.getCurveIdentifiers()) {
			System.out.println(path + id.toString());
		}
		for (CurveRegistry r : cr.getCurveRegestries()) {
			dump(path + r.getNameSpace() + ".", r);
		}
	}
	
	
	private void dump(String path, Map<String, AnalysisRow> map,
			CurveRegistry cr) {
		for (CurveIdentifier id : cr.getCurveIdentifiers()) {

			AnalysisRow row = cr.getAnalysisRow(new CurvePath() {
				@Override
				public String nextElement() {
					return id.toString() ;
				}

				@Override
				public CurveIdentifier nextCurveIdentifier() {
					return id;
				}

				@Override
				public boolean isLastElement() {
					return true;
				}

				@Override
				public boolean isEmpty() {
					return false;
				}
			});

			map.put(path + id.toString(), row);
		}
		for (CurveRegistry r : cr.getCurveRegestries()) {
			dump(path + r.getNameSpace() + ".", map, r);
		}
	}

	private void dump(RoicNetworkModel model, CurveIdentifier id) {
		System.out.println(toInfo(model.getAnalysisRow(id), id));
	}

	private void dump(RoicComponent component, CurveIdentifier id) {
		System.out.println(toInfo(component.getAnalysisRow(id), id));
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

	private RoicInputs createRoicInputs() {
		RoicInputs ri = new RoicInputs();
		ri.setComponentInputs(Collections.singleton(createComponentInput()));
		ri.setFixedCost(10000);
		ri.setType(NetworkAnalysisType.fiber);
		return ri;
	}

	private RoicInputs createCopperRoicInputs() {
		RoicInputs ri = new RoicInputs();
		ri.setComponentInputs(Collections
				.singleton(createCopperComponentInput()));
		ri.setFixedCost(10000);
		ri.setType(NetworkAnalysisType.copper);
		return ri;
	}

	private ComponentInput createCopperComponentInput() {

		return ComponentInput
				.build()
				.setComponentType(ComponentType.household)
				.setArpu(20)
				.setChurnRate(0.01)
				.setChurnRateDecrease(0.00006)
				.setEntityCount(500)
				.setEntityGrowth(0.0000)
				.setNetworkPenetration(
						new DefaultNetworkPenetration(0.8, 0.4, -.03))
				.setOpexPercent(0.043).assemble();
	}

	private ComponentInput createComponentInput() {

		return ComponentInput.build().setComponentType(ComponentType.household)
				.setArpu(100).setChurnRate(0.01).setChurnRateDecrease(0.00006)
				.setEntityCount(150).setEntityGrowth(0.0005)
				.setNetworkPenetration(createPenetration())
				.setOpexPercent(0.043).assemble();
	}

	private NetworkPenetration createPenetration() {
		return new DefaultNetworkPenetration(0.2, 0.6, -.03);
	}

}
