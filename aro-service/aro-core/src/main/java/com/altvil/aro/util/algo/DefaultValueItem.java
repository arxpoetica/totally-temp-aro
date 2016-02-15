package com.altvil.aro.util.algo;

import com.altvil.aro.util.algo.Knapsack.ValuedItem;

public class DefaultValueItem implements ValuedItem {

	private int count ;
	
	public DefaultValueItem(int count) {
		this.count = count ;
	}
	
	@Override
	public int getValue() {
		return count;
	}

	@Override
	public int getWeight() {
		return count;
	}

}
