package com.altvil.aro.processing.ignite;

import org.apache.ignite.Ignite;
import org.apache.ignite.IgniteException;
import org.apache.ignite.lifecycle.LifecycleBean;
import org.apache.ignite.lifecycle.LifecycleEventType;
import org.apache.ignite.resources.IgniteInstanceResource;
import org.apache.ignite.resources.SpringApplicationContextResource;
import org.springframework.context.ApplicationContext;

import com.altvil.aro.service.network.impl.NetworkServiceImpl;
import com.altvil.aro.service.planing.impl.NetworkPlanningServiceImpl;

public class AroLifecycleBean implements LifecycleBean {
	@IgniteInstanceResource
	Ignite ignite;
	
	@SpringApplicationContextResource
	ApplicationContext applicationContext;

	@Override
	public void onLifecycleEvent(LifecycleEventType evt) throws IgniteException {
		if (evt == LifecycleEventType.AFTER_NODE_START) {     
			NetworkServiceImpl nsi = (NetworkServiceImpl) applicationContext.getBean("networkService");
			
			nsi.setNetworkServiceIgniteGrid(ignite);
			NetworkPlanningServiceImpl npsi = (NetworkPlanningServiceImpl) applicationContext.getBean("networkPlanningService");
			
			npsi.setNetworkPlanningServiceIgniteGrid(ignite);
        }
	}

}
