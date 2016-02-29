package com.altvil.utils.conversion;

import com.altvil.utils.GeometryUtil;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.io.ParseException;

public class OrdinalEntityFactory {
	
	public final static OrdinalEntityFactory FACTORY = new OrdinalEntityFactory() ;
	
	public OrdinalEntity createOrdinalEntity(Object[] val) {
		return new OrdinalEntityImpl(val) ;
	}
	
	private static class OrdinalEntityImpl implements OrdinalEntity {

		private Object[] entity ; 
		
		public OrdinalEntityImpl(Object[] entity) {
			super();
			this.entity = entity;
		}

		private Object get(OrdinalAccessor index) {
			return entity[index.ordinal()] ;
		}
		
		@Override
		public Object getObject(OrdinalAccessor index) {
			return get(index) ;
		}

		@Override
		public long getLong(OrdinalAccessor index) {
			return ((Number) get(index)).longValue() ;
		}

		@Override
		public Point getPoint(OrdinalAccessor index) throws ParseException {
			return (Point) GeometryUtil.toGeometry(get(index).toString());
		}

		@Override
		public Geometry getGeometry(OrdinalAccessor index)
				throws ParseException {
			return  GeometryUtil.toGeometry(get(index).toString());
		}

		@Override
		public double getDouble(OrdinalAccessor index) {
			return ((Number) get(index)).doubleValue() ;
		}

		@Override
		public int getInteger(OrdinalAccessor index) {
			return ((Number) get(index)).intValue() ;
		}

		@Override
		public String getString(OrdinalAccessor index) {
			return ((Number) get(index)).toString() ;
		}
		
	}

}
