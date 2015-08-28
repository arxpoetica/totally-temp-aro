package com.altvil.aro.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

import com.vividsolutions.jts.geom.Point;

@Entity
@Table(name = "network_nodes")
public class NetworkNode {

	private int id;
	private double lattitude;
	private double longitude;
	private int node_type_id;
	private Point point;
	private Point geogPoint;
	private long routeId;


	@Id
	@Column(name = "id")
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	public int getId() {
		return id;
	}

	public void setId(int id) {
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


	@Column(name = "route_id")
	public long getRouteId() {
		return routeId;
	}

	public void setRouteId(long routeId) {
		this.routeId = routeId;
	}

}
