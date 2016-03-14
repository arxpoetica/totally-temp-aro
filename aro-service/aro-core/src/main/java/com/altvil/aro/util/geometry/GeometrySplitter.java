package com.altvil.aro.util.geometry;

import com.altvil.utils.GeometryUtil;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.linearref.LengthIndexedLine;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class GeometrySplitter {

	private Geometry geometry ;
	private LengthIndexedLine line;
	private double length;

	public GeometrySplitter(Geometry geometry) {
		this.geometry = geometry ;
		line = new LengthIndexedLine(geometry);
		length = geometry.getLength();
	}

	public Coordinate toOffsetCoordinate(double offsetRatio) {
		return line.extractPoint(offsetRatio * length);
	}

	public Point toOffsetPoint(double offsetRatio) {
		return GeometryUtil.asPoint(toOffsetCoordinate(offsetRatio));
	}

	/**
	 * 
	 * @param offsets
	 * @return Collection of lines split at offsets
	 */
	public List<Geometry> splitAtOffsets(Collection<Double> offsets) {
		
		List<Geometry> result = new ArrayList<Geometry>(offsets.size() +1) ;
		
		double previous = 0 ;
		for(double offset : offsets) {
			double currentOffset = offset * length ; 
			result.add(line.extractLine(previous, currentOffset)) ;
			previous = currentOffset ;
		}
		result.add(line.extractLine(previous, geometry.getLength())) ;
		
		return result ;		
	}

	

}
