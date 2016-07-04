package com.altvil.netop.roic;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.roic.RoicService;
import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.builder.config.AnalysisCode;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.model.curve.AnalysisRow;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;
import com.altvil.aro.service.strategy.NoSuchStrategy;

@RestController
public class RoicEndPoint {

	@Autowired
	private RoicService roicService;

	public static class CashFlow {
		int year;
		double bau;
		double fiber;
		double incremental;

		public CashFlow(int year, double bau, double fiber, double incremental) {
			super();
			this.year = year;
			this.bau = bau;
			this.fiber = fiber;
			this.incremental = incremental;
		}

		public int getYear() {
			return year;
		}

		public void setYear(int year) {
			this.year = year;
		}

		public double getBau() {
			return bau;
		}

		public void setBau(double bau) {
			this.bau = bau;
		}

		public double getFiber() {
			return fiber;
		}

		public void setFiber(double fiber) {
			this.fiber = fiber;
		}

		public double getIncremental() {
			return incremental;
		}

		public void setIncremental(double incremental) {
			this.incremental = incremental;
		}
		
		

	}

	@RequestMapping(value = "/financial_profile/{id}/cash_flow", method = RequestMethod.GET)
	public @ResponseBody List<CashFlow> getEquipmentSummary(
			@PathVariable("id") long planId) throws NoSuchStrategy,
			InterruptedException {

		List<CashFlow> result = new ArrayList<>();

		RoicModel model = roicService.getRoicModel(planId);

		if (model == null) {
			return result;
		}

		Map<NetworkAnalysisType, AnalysisRow> streamRows = new EnumMap<>(
				NetworkAnalysisType.class);

		streamRows.put(NetworkAnalysisType.bau,
				model.getRoicNetworkModel(NetworkAnalysisType.bau)
						.getAnalysisRow(AnalysisCode.cashflow));

		streamRows.put(NetworkAnalysisType.planned,
				model.getRoicNetworkModel(NetworkAnalysisType.planned)
						.getAnalysisRow(AnalysisCode.cashflow));

		streamRows.put(NetworkAnalysisType.incremental, model
				.getRoicNetworkModel(NetworkAnalysisType.incremental)
				.getAnalysisRow(AnalysisCode.cashflow));

		AnalysisPeriod p = model.getAnalysisPeriod();

		int year = p.getStartYear();
		for (int i = 0; i < p.getPeriods(); i++) {
			result.add(new CashFlow(year, streamRows.get(
					NetworkAnalysisType.bau).getValue(i), streamRows.get(
					NetworkAnalysisType.planned).getValue(i), streamRows.get(
					NetworkAnalysisType.incremental).getValue(i)));
			year++;
		}

		return result;

	}

	public static class Capex {
		int year;
		double network_deployment;
		double connect;
		double maintenance_capacity;
		
		

		public int getYear() {
			return year;
		}



		public void setYear(int year) {
			this.year = year;
		}



		public double getNetwork_deployment() {
			return network_deployment;
		}



		public void setNetwork_deployment(double network_deployment) {
			this.network_deployment = network_deployment;
		}



		public double getConnect() {
			return connect;
		}



		public void setConnect(double connect) {
			this.connect = connect;
		}



		public double getMaintenance_capacity() {
			return maintenance_capacity;
		}



		public void setMaintenance_capacity(double maintenance_capacity) {
			this.maintenance_capacity = maintenance_capacity;
		}



		public Capex(int year, double network_deployment, double connect,
				double maintenance_capacity) {
			super();
			this.year = year;
			this.network_deployment = network_deployment;
			this.connect = connect;
			this.maintenance_capacity = maintenance_capacity;
		}
	}

	@RequestMapping(value = "/financial_profile/{id}/capex", method = RequestMethod.GET)
	public @ResponseBody List<Capex> getCapex(@PathVariable("id") long planId)
			throws NoSuchStrategy, InterruptedException {

		List<Capex> result = new ArrayList<>();

		RoicModel model = roicService.getRoicModel(planId);

		if (model == null) {
			return result;
		}

		Map<CurveIdentifier, AnalysisRow> streamRows = new HashMap<>();

		streamRows.put(AnalysisCode.opex_expenses,
				model.getRoicNetworkModel(NetworkAnalysisType.bau)
						.getAnalysisRow(AnalysisCode.opex_expenses));

		streamRows.put(AnalysisCode.new_connections_cost,
				model.getRoicNetworkModel(NetworkAnalysisType.bau)
						.getAnalysisRow(AnalysisCode.new_connections_cost));

		streamRows.put(AnalysisCode.maintenance_expenses,
				model.getRoicNetworkModel(NetworkAnalysisType.bau)
						.getAnalysisRow(AnalysisCode.maintenance_expenses));

		AnalysisPeriod p = model.getAnalysisPeriod();

		int year = p.getStartYear();
		for (int i = 0; i < p.getPeriods(); i++) {
			result.add(new Capex(year, streamRows.get(
					AnalysisCode.opex_expenses).getValue(i), streamRows.get(
					AnalysisCode.new_connections_cost).getValue(i), streamRows
					.get(AnalysisCode.maintenance_expenses).getValue(i)));
			year++;
		}

		return result;

	}

	public static class Revenue {

		int year;
		double households;
		double businesses;
		double towers;
		
		

		public int getYear() {
			return year;
		}



		public void setYear(int year) {
			this.year = year;
		}



		public double getHouseHolds() {
			return households;
		}



		public void setHouseHolds(double houseHolds) {
			this.households = houseHolds;
		}



		public double getBusinesses() {
			return businesses;
		}



		public void setBusinesses(double businesses) {
			this.businesses = businesses;
		}



		public double getTowers() {
			return towers;
		}



		public void setTowers(double towers) {
			this.towers = towers;
		}



		public Revenue(int year, double houseHolds, double businesses,
				double towers) {
			super();

			this.year = year;
			this.households = houseHolds;
			this.businesses = businesses;
			this.towers = towers;
		}

	}

	@RequestMapping(value = "/financial_profile/{id}/revenue", method = RequestMethod.GET)
	public @ResponseBody List<Revenue> getEquipmentSummaryX(
			@PathVariable("id") long planId) throws NoSuchStrategy,
			InterruptedException {

		List<Revenue> result = new ArrayList<>();

		RoicModel model = roicService.getRoicModel(planId);

		if (model == null) {
			return result;
		}

		Map<NetworkAnalysisType, AnalysisRow> streamRows = new EnumMap<>(
				NetworkAnalysisType.class);

		streamRows.put(NetworkAnalysisType.bau,
				model.getRoicNetworkModel(NetworkAnalysisType.bau)
						.getAnalysisRow(AnalysisCode.revenue));

		AnalysisPeriod p = model.getAnalysisPeriod();

		int year = p.getStartYear();
		for (int i = 0; i < p.getPeriods(); i++) {
			result.add(new Revenue(year, streamRows
					.get(NetworkAnalysisType.bau).getValue(i), 0, 0));
			year++;
		}

		return result;

	}

	public static class Premisies {
		int year;
		double incremental;
		double existing;
		
		
		

		public int getYear() {
			return year;
		}




		public void setYear(int year) {
			this.year = year;
		}




		public double getIncremental() {
			return incremental;
		}




		public void setIncremental(double incremental) {
			this.incremental = incremental;
		}




		public double getExisting() {
			return existing;
		}




		public void setExisting(double existing) {
			this.existing = existing;
		}




		public Premisies(int year, double incremental, double existing) {
			super();
			this.year = year;
			this.incremental = incremental;
			this.existing = existing;
		}

	}

	@RequestMapping(value = "/financial_profile/{id}/premises", method = RequestMethod.GET)
	public @ResponseBody List<Premisies> getPremises(
			@PathVariable("id") long planId) throws NoSuchStrategy,
			InterruptedException {

		List<Premisies> result = new ArrayList<>();

		RoicModel model = roicService.getRoicModel(planId);

		if (model == null) {
			return result;
		}

		Map<NetworkAnalysisType, AnalysisRow> streamRows = new EnumMap<>(
				NetworkAnalysisType.class);

		streamRows.put(NetworkAnalysisType.incremental, model
				.getRoicNetworkModel(NetworkAnalysisType.incremental)
				.getAnalysisRow(AnalysisCode.premises_passed));

		streamRows.put(NetworkAnalysisType.copper,
				model.getRoicNetworkModel(NetworkAnalysisType.copper)
						.getAnalysisRow(AnalysisCode.premises_passed));

		AnalysisPeriod p = model.getAnalysisPeriod();

		int year = p.getStartYear();
		for (int i = 0; i < p.getPeriods(); i++) {
			result.add(new Premisies(year, streamRows.get(
					NetworkAnalysisType.incremental).getValue(i), streamRows
					.get(NetworkAnalysisType.copper).getValue(i)));
			year++;
		}

		return result;
	}

	public static class Subscribers {
		int year;
		double bau;
		double fiber;
		
		

		public int getYear() {
			return year;
		}



		public void setYear(int year) {
			this.year = year;
		}



		public double getBau() {
			return bau;
		}



		public void setBau(double bau) {
			this.bau = bau;
		}



		public double getFiber() {
			return fiber;
		}



		public void setFiber(double fiber) {
			this.fiber = fiber;
		}



		public Subscribers(int year, double bau, double fiber) {
			super();
			this.year = year;
			this.bau = bau;
			this.fiber = fiber;
		}

	}

	@RequestMapping(value = "/financial_profile/{id}/subscribers", method = RequestMethod.GET)
	public @ResponseBody List<Subscribers> getSubscribers(
			@PathVariable("id") long planId) throws NoSuchStrategy,
			InterruptedException {

		List<Subscribers> result = new ArrayList<>();

		RoicModel model = roicService.getRoicModel(planId);

		if (model == null) {
			return result;
		}

		Map<NetworkAnalysisType, AnalysisRow> streamRows = new EnumMap<>(
				NetworkAnalysisType.class);

		streamRows.put(NetworkAnalysisType.bau,
				model.getRoicNetworkModel(NetworkAnalysisType.bau)
						.getAnalysisRow(AnalysisCode.premises_passed));

		streamRows.put(NetworkAnalysisType.planned,
				model.getRoicNetworkModel(NetworkAnalysisType.planned)
						.getAnalysisRow(AnalysisCode.premises_passed));

		AnalysisPeriod p = model.getAnalysisPeriod();

		int year = p.getStartYear();
		for (int i = 0; i < p.getPeriods(); i++) {
			result.add(new Subscribers(year, streamRows.get(
					NetworkAnalysisType.bau).getValue(i), streamRows.get(
					NetworkAnalysisType.planned).getValue(i)));
			year++;
		}

		return result;
	}

	public static class Penetration {
		int year;
		double business;
		double households;
		double towers;
		
		

		public int getYear() {
			return year;
		}



		public void setYear(int year) {
			this.year = year;
		}



		public double getBusiness() {
			return business;
		}



		public void setBusiness(double business) {
			this.business = business;
		}



		public double getHouseholds() {
			return households;
		}



		public void setHouseholds(double households) {
			this.households = households;
		}



		public double getTowers() {
			return towers;
		}



		public void setTowers(double towers) {
			this.towers = towers;
		}



		public Penetration(int year, double business, double households,
				double towers) {
			super();
			this.year = year;
			this.business = business;
			this.households = households;
			this.towers = towers;
		}

	}

	@RequestMapping(value = "/financial_profile/{id}/penetration", method = RequestMethod.GET)
	public @ResponseBody List<Penetration> getPenetration(
			@PathVariable("id") long planId) throws NoSuchStrategy,
			InterruptedException {

		List<Penetration> result = new ArrayList<>();

		RoicModel model = roicService.getRoicModel(planId);

		if (model == null) {
			return result;
		}

		Map<NetworkAnalysisType, AnalysisRow> streamRows = new EnumMap<>(
				NetworkAnalysisType.class);

		streamRows.put(NetworkAnalysisType.planned,
				model.getRoicNetworkModel(NetworkAnalysisType.planned)
						.getEntityAnalysis(ComponentType.household)
						.getAnalysisRow(AnalysisCode.penetration));

		AnalysisPeriod p = model.getAnalysisPeriod();

		int year = p.getStartYear();
		for (int i = 0; i < p.getPeriods(); i++) {
			result.add(new Penetration(year, 0, streamRows.get(
					NetworkAnalysisType.planned).getValue(i), 0));
			year++;
		}

		return result;
	}

}
