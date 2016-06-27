package com.altvil.test.price;

import java.util.Date;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.price.PricingModel;
import com.altvil.aro.service.price.PricingService;


@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(value = "/test-config.xml")
public class PriceTest {
	
	
	@Autowired
	private PricingService pricingService ;
	
	@Test
	public void testPrice() {
		PricingModel model = pricingService.getPricingModel("*", new Date()) ;
		Assert.assertTrue(model.getMaterialCost(MaterialType.CO, 1) > 0);
		Assert.assertTrue(model.getMaterialCost(MaterialType.FDT, 1) > 0);
		Assert.assertTrue(model.getMaterialCost(MaterialType.FDH, 1) > 0);
		
	}
	

}
