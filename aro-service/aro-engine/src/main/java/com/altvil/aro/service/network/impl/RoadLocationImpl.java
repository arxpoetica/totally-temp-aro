package com.altvil.aro.service.network.impl;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.interfaces.RoadLocation;
import com.altvil.utils.GeometryUtil;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.io.ParseException;

@SuppressWarnings("serial")
public class RoadLocationImpl implements RoadLocation, Serializable{

	public static Builder build() {
		return new Builder() ;
	}
	
	public static class Builder {

		private RoadLocationImpl roadLocation = new RoadLocationImpl();

		public Builder setTlid(long tlid) {
			roadLocation.tlid = tlid;
			return this;
		}

		public Builder setRoadSegmentPositionRatio(double ratio) {
			roadLocation.roadSegmentPositionRatio = ratio;
			return this;
		}

		public Builder setRoadSegmentClosestPoint(Point point) {
			roadLocation.roadSegmentClosestPoint = point;
			return this;
		}

		public Builder setRoadSegmentClosestPoint(String wkt) throws ParseException {
			 setRoadSegmentClosestPoint((Point) GeometryUtil
					.toGeometry(wkt));
			 
			 return this ;
		}

		public Builder setDistanceFromRoadSegmentInMeters(double distance) {
			roadLocation.distanceFromRoadSegmentInMeters = distance;
			return this;
		}
		
		public Builder setLocationPoint(String wkt) throws ParseException {
			setLocationPoint((Point) GeometryUtil
					.toGeometry(wkt));
			 
			 return this ;
		}

		public Builder setLocationPoint(Point point) {
			roadLocation.locationPoint = point;
			return this;
		}

		public RoadLocation build() {
			return roadLocation;
		}

	}

	private long tlid;

	private double roadSegmentPositionRatio;
	private Point roadSegmentClosestPoint;
	private double distanceFromRoadSegmentInMeters;
	private Point locationPoint;
	
	public String toString() {
		return new ToStringBuilder(this).append("tlid", tlid)
				.append("roadSegmentClosestPoint",
						roadSegmentClosestPoint == null ? null
								: String.valueOf(roadSegmentClosestPoint.getY()) + " " + roadSegmentClosestPoint.getX())
				.toString();
	}

	private RoadLocationImpl() {
	}

	@Override
	public long getRoadSegmentId() {
		return tlid;
	}

	@Override
	public double getRoadSegmentPositionRatio() {
		return roadSegmentPositionRatio;
	}

	@Override
	public Point getRoadSegmentClosestPoint() {
		return roadSegmentClosestPoint;
	}

	@Override
	public double getDistanceFromRoadSegmentInMeters() {
		return distanceFromRoadSegmentInMeters;
	}

	@Override
	public long getTlid() {
		return tlid;
	}

	@Override
	public Point getLocationPoint() {
		return locationPoint;
	}

}
