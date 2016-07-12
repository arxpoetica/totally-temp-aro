package com.altvil.aro.model;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Transient;

import com.altvil.aro.util.json.GeometryJsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.vividsolutions.jts.geom.Point;

@Entity
@Table(name = "network_nodes", schema = "client")
public class NetworkNode extends ComparableModel {

	private Long id;
	// private String stateCode; //Create a Logical Partition
	private Double lattitude;
	private Double longitude;
	private NetworkNodeType networkNodeType;
	private Point point;
	private Point geogPoint;

	private double houseHoldCount;
	private double businessCount;
	private double cellTowerCount;
	private double atomicUnit;

	private long routeId;

	@Transient
	@Override
	protected Serializable idKey() {
		return id;
	}

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	// @TableGenerator(schema = "vz", table = "id_table", name =
	// "gen_id_network_node", allocationSize = 1000, initialValue = 0,
	// pkColumnName = "name", valueColumnName = "int_value", pkColumnValue =
	// "network_node")
	// @GeneratedValue(strategy = GenerationType.TABLE, generator =
	// "gen_id_network_node")
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	@Column(name = "lat")
	public Double getLattitude() {
		return lattitude;
	}

	public void setLattitude(Double lattitude) {
		this.lattitude = lattitude;
	}

	@Column(name = "lon")
	public Double getLongitude() {
		return longitude;
	}

	public void setLongitude(Double longitude) {
		this.longitude = longitude;
	}

	@Column(name = "node_type_id")
	@Enumerated(EnumType.ORDINAL)
	public NetworkNodeType getNetworkNodeType() {
		return networkNodeType;
	}

	public void setNetworkNodeType(NetworkNodeType networkNodeType) {
		this.networkNodeType = networkNodeType;
	}

	@Column(name = "geom")
	@JsonDeserialize(using = GeometryJsonDeserializer.class)
	public Point getPoint() {
		return point;
	}

	public void setPoint(Point point) {
		this.point = point;
	}

	@Column(name = "geog")
	@JsonDeserialize(using = GeometryJsonDeserializer.class)
	public Point getGeogPoint() {
		return geogPoint;
	}

	public void setGeogPoint(Point geogPoint) {
		this.geogPoint = geogPoint;
	}

	@Column(name = "atomic_count")
	public Double getAtomicUnit() {
		return atomicUnit;
	}

	public void setAtomicUnit(Double atomicUnit) {
		this.atomicUnit = atomicUnit;
	}

	@Column(name = "household_count")
	public double getHouseHoldCount() {
		return houseHoldCount;
	}

	public void setHouseHoldCount(double houseHoldCount) {
		this.houseHoldCount = houseHoldCount;
	}

	@Column(name = "business_count")
	public double getBusinessCount() {
		return businessCount;
	}

	public void setBusinessCount(double businessCount) {
		this.businessCount = businessCount;
	}

	@Column(name = "celltower_count")
	public double getCellTowerCount() {
		return cellTowerCount;
	}

	public void setCellTowerCount(double cellTowerCount) {
		this.cellTowerCount = cellTowerCount;
	}

	@Column(name = "plan_id")
	// @Convert(converter = PlanIdConverter.class)
	public long getRouteId() {
		return routeId;
	}

	public void setRouteId(long routeId) {
		this.routeId = routeId;
	}

	// @Column(name = "state_fips_code")
	// public String getStateCode() {
	// return stateCode;
	// }
	//
	// public void setStateCode(String stateCode) {
	// this.stateCode = stateCode;
	// }

}
