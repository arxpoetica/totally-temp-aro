package com.altvil.aro.util.algo;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class Knapsack {

	public interface ValuedItem {
		public int getValue();

		public int getWeight();
	}

	private int[][] memoizedTable;

	private List<ValuedItem> items;
	private int capacity;

	private int maxValue;

	public Knapsack(List<ValuedItem> items, int capacity) {

		this.capacity = capacity ;
		this.items = items;

		memoizedTable = new int[capacity + 1][items.size()];

		for (int j = 0; j < capacity + 1; j++)
			for (int i = 0; i < items.size(); i++)
				memoizedTable[j][i] = -1;

		
		maxValue = maximise(capacity, items.size() - 1);
	}

	public Knapsack(Collection<ValuedItem> items, int capacity) {
		this(new ArrayList<>(items), capacity);
	}

	public int getMaxValue() {
		return maxValue;
	}

	public List<ValuedItem> getSelectedItems() {

		List<ValuedItem> result = new ArrayList<>();

		int i = items.size() - 1, j = capacity;

		while (i >= 0) {
			ValuedItem item = items.get(i);
			double without = (i == 0) ? 0 : memoizedTable[j][i - 1];
			if (memoizedTable[j][i] != without) {
				result.add(item);
				j -= (int) item.getWeight();
			}

			i--;
		}

		return result;

	}

	private int maximise(int weight, int i) {

		if (i < 0 || weight < 0) {
			return 0;
		}

		ValuedItem item = items.get(i);
		int cell = memoizedTable[weight][i];

		if (cell > -1) {
			return cell;
		}
		
		cell = Math.max( (item.getWeight() > weight) ? -1 : item.getValue()
				+ maximise(weight - item.getWeight(), i - 1), maximise(weight, i - 1)) ;
	
		memoizedTable[weight][i] = cell; // Memoize

		return cell;
	}

	public static void main(String[] args) {

		List<ValuedItem> items = new ArrayList<>();
		items.add(new DefaultValueItem(3));
		items.add(new DefaultValueItem(8));
		items.add(new DefaultValueItem(8));
		items.add(new DefaultValueItem(4));
		items.add(new DefaultValueItem(8));
	

		Knapsack knapSack = new Knapsack(items, 21);
		System.out.println(knapSack.getMaxValue());
		
		for(ValuedItem vi : knapSack.getSelectedItems()) {
			System.out.println(vi.getValue()) ;
		}
		

	}

}
