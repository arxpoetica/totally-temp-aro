package com.altvil.netop.json;

import com.altvil.aro.persistence.HibernateAwareObjectMapper;

public class AroServiceObjectMapper extends HibernateAwareObjectMapper {
	private static final long serialVersionUID = 1L;

public AroServiceObjectMapper() {
	registerModule(new AroServiceModule());
}
}
