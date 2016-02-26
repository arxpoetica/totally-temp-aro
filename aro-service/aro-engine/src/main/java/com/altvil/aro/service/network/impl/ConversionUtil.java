package com.altvil.aro.service.network.impl;

import com.altvil.utils.GeometryUtil;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.io.ParseException;

public class ConversionUtil {
	
	public static long asLong(Object object) {
		return ((Number) object).longValue();
	}

	public static Point asPoint(Object value) throws ParseException {
		return (Point) GeometryUtil.toGeometry(value.toString());
	}
	
	public static Geometry asGeometry(Object value) throws ParseException {
		return  GeometryUtil.toGeometry(value.toString());
	}

	public static double asDouble(Object value) {
		return ((Number) value).doubleValue();
	}
	
	public static int asInteger(Object value) {
		return ((Number) value).intValue();
	}

}
