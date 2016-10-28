package com.altvil.aro.model;

import javax.persistence.*;

@Entity
@Table(name = "plan_location_link", schema = "client")
public class PlanLocationLink {
	private Long id;

	private Long planId;

	private long locationId;
	private String state;
	private int entityTypeId;
	private int linkingState; // --1 linked, 2 constraint_violated (15km for
								// example), 3 unreachable
	private String attribute;

	private double rawCoverage ;
	private double atomicUnits ;
	private double totalRevenue ;
	private double monthlyRevenueImpact ;
	private double penetration ;
	private double fairShareDemand ;


	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.SEQUENCE,
			generator = "plan_location_link_id_seq")
	@SequenceGenerator(name = "plan_location_link_id_seq", schema = "client", sequenceName = "plan_location_link_id_seq", allocationSize = 1000)
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}


	@Column(name = "plan_id")
	public Long getPlanId() {
		return planId;
	}

	public void setPlanId(Long planId) {
		this.planId = planId;
	}

	@Column(name="location_id")
	public long getLocationId() {
		return locationId;
	}

	public void setLocationId(long locationId) {
		this.locationId = locationId;
	}

	@Column(name="state")
	public String getState() {
		return state;
	}

	public void setState(String state) {
		this.state = state;
	}

	
	@Column(name="entity_type_id")
	public int getEntityTypeId() {
		return entityTypeId;
	}

	public void setEntityTypeId(int entityTypeId) {
		this.entityTypeId = entityTypeId;
	}

	
	@Column(name="linking_state_id")
	public int getLinkingState() {
		return linkingState;
	}

	public void setLinkingState(int linkingState) {
		this.linkingState = linkingState;
	}

	@Column(name="attr")
	public String getAttribute() {
		return attribute;
	}

	public void setAttribute(String attribute) {
		this.attribute = attribute;
	}

	@Column(name="raw_coverage")
	public double getRawCoverage() {
		return rawCoverage;
	}

	public void setRawCoverage(double rawCoverage) {
		this.rawCoverage = rawCoverage;
	}

	@Column(name="atomic_units")
	public double getAtomicUnits() {
		return atomicUnits;
	}

	public void setAtomicUnits(double atomicUnits) {
		this.atomicUnits = atomicUnits;
	}

	@Column(name="total_revenue")
	public double getTotalRevenue() {
		return totalRevenue;
	}

	public void setTotalRevenue(double totalRevenue) {
		this.totalRevenue = totalRevenue;
	}

	@Column(name="monthly_revenue")
	public double getMonthlyRevenueImpact() {
		return monthlyRevenueImpact;
	}

	public void setMonthlyRevenueImpact(double monthlyRevenueImpact) {
		this.monthlyRevenueImpact = monthlyRevenueImpact;
	}

	@Column(name="penetration")
	public double getPenetration() {
		return penetration;
	}

	public void setPenetration(double penetration) {
		this.penetration = penetration;
	}

	@Column(name="fairshare_demand")
	public double getFairShareDemand() {
		return fairShareDemand;
	}

	public void setFairShareDemand(double fairShareDemand) {
		this.fairShareDemand = fairShareDemand;
	}
	
	

}
