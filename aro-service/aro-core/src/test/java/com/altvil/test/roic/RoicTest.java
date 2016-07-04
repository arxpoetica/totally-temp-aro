package com.altvil.test.roic;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.builder.RoicConstants;
import com.altvil.aro.service.roic.analysis.builder.model.RoicBuilderService;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.curve.AnalysisRow;



@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(value = "/test-config.xml")
public class RoicTest {

	@Autowired
	private RoicBuilderService roicBuilderService;

	@Before
	public void init() {
	}

	@Test
	public void testRoic() {

		AnalysisPeriod ap = new AnalysisPeriod(2016, 15);

		RoicInputs copperInputs = RoicInputs.updateInputs(
				RoicConstants.CopperInputs, 200, 0);
		RoicInputs fiberInputs = RoicInputs.updateInputs(
				RoicConstants.FiberConstants, 120, 100000);

		RoicModel model = roicBuilderService.buildModel().setAnalysisPeriod(ap)
				.addRoicInputs(copperInputs).addRoicInputs(copperInputs)
				.addRoicInputs(fiberInputs).build();

		Writer w = new StringWriter();
		PrintWriter pw = new PrintWriter(w, true);
		pw.flush();
		write(model, pw);
		System.out.println(w.toString());

	}

	public void write(RoicModel model, PrintWriter ps) {
		List<String> curves = new ArrayList<>(model.getCurvePaths());
		Collections.sort(curves);

		for (String c : curves) {
			write(ps, c, model.getAnalysisRow(c));
		}

	}

	private void write(PrintWriter ps, String c, AnalysisRow r) {
		ps.print(c);

		for (int i = 0; i < r.getSize(); i++) {
			ps.print(",");
			ps.print(r.getValue(i));
		}

		ps.println();
	}

	// private RoicInputs createRoicInputs() {
	// RoicInputs ri = new RoicInputs();
	// ri.setComponentInputs(Collections.singleton(createComponentInput()));
	// ri.setFixedCost(10000);
	// ri.setType(NetworkAnalysisType.fiber);
	// return ri;
	// }
	//
	// private RoicInputs createCopperRoicInputs() {
	// RoicInputs ri = new RoicInputs();
	// ri.setComponentInputs(Collections
	// .singleton(createCopperComponentInput()));
	// ri.setFixedCost(10000);
	// ri.setType(NetworkAnalysisType.copper);
	// return ri;
	// }

	// private ComponentInput createCopperComponentInput() {
	//
	// return ComponentInput
	// .build()
	// .setComponentType(ComponentType.household)
	// .setArpu(20)
	// .setChurnRate(0.01)
	// .setChurnRateDecrease(0.00006)
	// .setEntityCount(500)
	// .setEntityGrowth(0.0000)
	// .setNetworkPenetration(
	// new DefaultNetworkPenetration(0.8, 0.4, -.03))
	// .setOpexPercent(0.043).assemble();
	// }
	//
	// private ComponentInput createComponentInput() {
	//
	// return ComponentInput.build().setComponentType(ComponentType.household)
	// .setArpu(100).setChurnRate(0.01).setChurnRateDecrease(0.00006)
	// .setEntityCount(150).setEntityGrowth(0.0005)
	// .setNetworkPenetration(createPenetration())
	// .setOpexPercent(0.043).assemble();
	// }
	//
	// private NetworkPenetration createPenetration() {
	// return new DefaultNetworkPenetration(0.2, 0.6, -.03);
	// }

}
