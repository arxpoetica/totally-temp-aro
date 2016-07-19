package com.altvil.aro.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;

@Entity
@Table(name = "roic_component_input", schema = "financial")
public class RoicComponentInputModel {

	/*
	 * 
	 * "id" serial PRIMARY KEY, speed_type_id int4 references client.speed_type,
	 * entity_category_id int4 references client.entity_category,
	 * 
	 * arpu double precision,
	 * 
	 * penetration_start double precision, penetration_end double precision,
	 * penetration_rate double precision,
	 * 
	 * entity_growth double precision, churn_rate double precision,
	 * churn_rate_decrease double precision, opex_percent double precision,
	 * maintenance_expenses double precision, connection_cost double precision
	 */

	private Long id;
	private int speedCategory;
	private ComponentType entityType;

	private double arpu;
	private double penetrationStart;
	private double penetrationEnd;
	private double penetrationRate;

	private double entityGrowth;
	private double churnRate;
	private double churnRateDecrease;
	private double opexPercent;
	private double maintenanceExpenses;
	private double connectionCost;

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	@Column(name="speed_type_id")
	public int getSpeedCategory() {
		return speedCategory;
	}

	public void setSpeedCategory(int speedCategory) {
		this.speedCategory = speedCategory;
	}

	
	@Enumerated
	@Column(name="entity_category_id")
	public ComponentType getEntityType() {
		return entityType;
	}

	public void setEntityType(ComponentType entityType) {
		this.entityType = entityType;
	}

	@Column(name="arpu")
	public double getArpu() {
		return arpu;
	}

	public void setArpu(double arpu) {
		this.arpu = arpu;
	}

	@Column(name="penetration_start")
	public double getPenetrationStart() {
		return penetrationStart;
	}

	public void setPenetrationStart(double penetrationStart) {
		this.penetrationStart = penetrationStart;
	}

	@Column(name="penetration_end")
	public double getPenetrationEnd() {
		return penetrationEnd;
	}

	public void setPenetrationEnd(double penetrationEnd) {
		this.penetrationEnd = penetrationEnd;
	}

	@Column(name="penetration_rate")
	public double getPenetrationRate() {
		return penetrationRate;
	}

	public void setPenetrationRate(double penetrationRate) {
		this.penetrationRate = penetrationRate;
	}

	@Column(name="entity_growth")
	public double getEntityGrowth() {
		return entityGrowth;
	}

	public void setEntityGrowth(double entityGrowth) {
		this.entityGrowth = entityGrowth;
	}

	@Column(name="churn_rate")
	public double getChurnRate() {
		return churnRate;
	}

	public void setChurnRate(double churnRate) {
		this.churnRate = churnRate;
	}

	@Column(name="churn_rate_decrease")
	public double getChurnRateDecrease() {
		return churnRateDecrease;
	}

	public void setChurnRateDecrease(double churnRateDecrease) {
		this.churnRateDecrease = churnRateDecrease;
	}

	@Column(name="opex_percent")
	public double getOpexPercent() {
		return opexPercent;
	}

	public void setOpexPercent(double opexPercent) {
		this.opexPercent = opexPercent;
	}

	@Column(name="maintenance_expenses")
	public double getMaintenanceExpenses() {
		return maintenanceExpenses;
	}

	public void setMaintenanceExpenses(double maintenanceExpenses) {
		this.maintenanceExpenses = maintenanceExpenses;
	}

	
	@Column(name="connection_cost")
	public double getConnectionCost() {
		return connectionCost;
	}

	public void setConnectionCost(double connectionCost) {
		this.connectionCost = connectionCost;
	}

}
