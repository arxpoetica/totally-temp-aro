package com.altvil.aro.service;

import com.altvil.aro.service.config.ConfigService;
import com.altvil.aro.service.config.impl.ConfigServiceImpl;
import com.altvil.aro.service.dao.DAOService;
import com.altvil.aro.service.dao.impl.DAOServiceImpl;
import com.altvil.aro.service.graph.GraphService;
import com.altvil.aro.service.graph.impl.GraphServiceImpl;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.node.impl.GraphNodeFactoryImpl;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.impl.GraphTransformerFactoryImpl;
import com.altvil.aro.service.persistence.PersistenceService;
import com.altvil.aro.service.persistence.impl.HibernatePersistence;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.plan.impl.PlanServiceImpl;
import com.altvil.aro.service.recalc.RecalcService;
import com.altvil.aro.service.recalc.impl.RecalcServiceImpl;
import com.google.inject.AbstractModule;

public class AppInjector extends AbstractModule  {

	@Override
	protected void configure() {
		bind(ConfigService.class).to(ConfigServiceImpl.class) ;
		bind(PersistenceService.class).to(HibernatePersistence.class) ;
		bind(DAOService.class).to(DAOServiceImpl.class) ;
		bind(GraphNodeFactory.class).to(GraphNodeFactoryImpl.class) ;
		bind(GraphService.class).to(GraphServiceImpl.class) ;
		bind(GraphTransformerFactory.class).to(GraphTransformerFactoryImpl.class) ;
		bind(PlanService.class).to(PlanServiceImpl.class) ;
		bind(RecalcService.class).to(RecalcServiceImpl.class) ;
	}

}
