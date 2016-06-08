package com.altvil.netop.json;

import com.altvil.aro.persistence.HibernateAwareObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class AroServiceObjectMapper extends HibernateAwareObjectMapper {
	private static final long serialVersionUID = 1L;
	
	public AroServiceObjectMapper() {
		registerModule(new AroServiceModule());
		configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
			}
}
