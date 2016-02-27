package com.altvil.aro.model;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Transient;

import com.vividsolutions.jts.geom.Point;

@Entity
@Table(name = "network_nodes", schema="client")
public class NetworkNode extends ComparableModel {

	private Long id;
	//private String stateCode; //Create a Logical Partition 
	private double lattitude;
	private double longitude;
	private int node_type_id;
	private Point point;
	private Point geogPoint;
	private long routeId;
	
	@Transient
	@Override
	protected Serializable getIdKey() {
		return id ;
	}

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	//@TableGenerator(schema = "vz", table = "id_table", name = "gen_id_network_node", allocationSize = 1000, initialValue = 0, pkColumnName = "name", valueColumnName = "int_value", pkColumnValue = "network_node")
	//@GeneratedValue(strategy = GenerationType.TABLE, generator = "gen_id_network_node")
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	@Column(name = "lat")
	public double getLattitude() {
		return lattitude;
	}

	public void setLattitude(double lattitude) {
		this.lattitude = lattitude;
	}

	@Column(name = "lon")
	public double getLongitude() {
		return longitude;
	}

	public void setLongitude(double longitude) {
		this.longitude = longitude;
	}

	@Column(name = "node_type_id")
	public int getNodeTypeId() {
		return node_type_id;
	}

	public void setNodeTypeId(int node_type_id) {
		this.node_type_id = node_type_id;
	}

	@Column(name = "geom")
	public Point getPoint() {
		return point;
	}

	public void setPoint(Point point) {
		this.point = point;
	}

	@Column(name = "geog")
	public Point getGeogPoint() {
		return geogPoint;
	}

	public void setGeogPoint(Point geogPoint) {
		this.geogPoint = geogPoint;
	}

	@Column(name = "plan_id")
	public long getRouteId() {
		return routeId;
	}

	public void setRouteId(long routeId) {
		this.routeId = routeId;
	}

//	@Column(name = "state_fips_code")
//	public String getStateCode() {
//		return stateCode;
//	}
//
//	public void setStateCode(String stateCode) {
//		this.stateCode = stateCode;
//	}

}
