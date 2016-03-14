package com.altvil.aro.persistence;

import java.sql.Types;

import org.hibernate.spatial.dialect.postgis.PostgisDialect;

public class JsonPostgisHibernateDialect  extends PostgisDialect {
    /**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public JsonPostgisHibernateDialect() {

        super();

        this.registerColumnType(Types.JAVA_OBJECT, "json");
        registerHibernateType(Types.ARRAY, "smallint[$l]");
    }
}
