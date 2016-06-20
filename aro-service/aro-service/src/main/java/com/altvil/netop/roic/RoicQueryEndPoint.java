package com.altvil.netop.roic;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.altvil.aro.service.roic.RoicQueryService;
import com.altvil.aro.service.roic.analysis.RowReference;
import com.altvil.netop.roic.RoicEndPoint.CashFlow;
import com.altvil.utils.StreamUtil;

public class RoicQueryEndPoint {

	private RoicQueryService roicQueryService;

	@RequestMapping(value = "/roic/models/{id}", method = RequestMethod.GET)
	public @ResponseBody List<RoicCurve> getEquipmentSummary(
			@PathVariable("id") long planId,
			@RequestParam(value = "$select") String selectClause) {

		Collection<RowReference> cols = roicQueryService.queryRoic(planId,
				toStringList(selectClause));

		return cols.stream().map(
				rr -> new RoicCurve(rr.getIdentifier().toString(), rr
						.getAnalysisRow().getRawData())).collect(Collectors.toList());

	}

	public static class RoicCurve {
		private String name;
		double[] values;

		public RoicCurve(String name, double[] values) {
			super();
			this.name = name;
			this.values = values;
		}

		public String getName() {
			return name;
		}

		public void setName(String name) {
			this.name = name;
		}

		public double[] getValues() {
			return values;
		}

		public void setValues(double[] values) {
			this.values = values;
		}

	}

	private static List<String> toStringList(String s) {
		return StreamUtil.map(s.split(","), String::trim);
	}

}
