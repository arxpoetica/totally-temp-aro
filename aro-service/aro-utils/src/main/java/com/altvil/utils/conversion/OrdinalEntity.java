package com.altvil.utils.conversion;

import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.io.ParseException;

public interface OrdinalEntity {
	
	public Object getObject(OrdinalAccessor index) ;
	
	public long getLong(OrdinalAccessor index) ;

	public  Point getPoint(OrdinalAccessor index) throws ParseException ;
	
	public Geometry getGeometry(OrdinalAccessor index) throws ParseException ;

	public double getDouble(OrdinalAccessor index) ;
	
	public  int getInteger(OrdinalAccessor index); 
	
	public String getString(OrdinalAccessor index) ;

}
