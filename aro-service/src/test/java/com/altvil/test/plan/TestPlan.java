package com.altvil.test.plan;

import java.util.EnumSet;

import org.junit.Test;

import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.service.MainEntry;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.plan.RecalcRequest;

public class TestPlan {

	public void test() {
		try {
			MainEntry.service(PlanService.class).deleteNetworkNodes(4, EnumSet.of(NetworkNodeType.fiber_distribution_terminal));
		} catch( Throwable err) {
			err.printStackTrace(); 
		}
	}
	
	@Test
	public void testGenerate() {
		try {
			
			RecalcRequest rr = new RecalcRequest() {
				
				@Override
				public int getPlanId() {
					return 1;
				}
				
				@Override
				public Integer getFdtCount() {
					return null ; // return 10;
				}
				
				@Override
				public Integer getFdhCount() {
					return null ;
				}
			}; 
			
			MainEntry.service(PlanService.class).computeNetworkNodes(rr);
			System.out.println("Done") ;
		
		} catch( Throwable err) {
			err.printStackTrace(); 
		}
	}
}
