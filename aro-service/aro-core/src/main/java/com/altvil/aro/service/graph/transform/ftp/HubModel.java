package com.altvil.aro.service.graph.transform.ftp;

import java.util.ArrayList;
import java.util.List;

import com.altvil.aro.service.entity.MaterialType;

public class HubModel {

	public static HubModel create(int splitterRatio) {
		return create(splitterRatio, 10, 26, 32);
	}

	public static HubModel create(int splitterRatio, int minSplitters,
			int idealSplitters, int maxSplitters) {
		return new HubModel(splitterRatio, minSplitters, idealSplitters,
				maxSplitters);
	}

	private int splitterRatio;

	private int minHhCount;
	private int maxHhCount;
	private int idealHhCount;

	private MaterialType materialType;

	private List<Integer> splittersCounts;

	public HubModel(int splitterRatio, int minSplitters, int idealSplitters,
			int maxSplitters) {
		super();
		this.splitterRatio = splitterRatio;

		this.materialType = MaterialType.getOpticalSplitter(splitterRatio);
		init(splitterRatio, minSplitters, idealSplitters, maxSplitters);
	}

	private void init(int splitterRatio, int minSplitters, int idealSplitters,
			int maxSplitters) {
		splittersCounts = new ArrayList<>(maxSplitters);
		for (int i = 1; i <= maxSplitters; i++) {
			splittersCounts.add(getHHCountforSplitterCount(i));
		}

		minHhCount = getHHCountforSplitterCount(minSplitters);
		idealHhCount = getHHCountforSplitterCount(idealSplitters);
		maxHhCount = getHHCountforSplitterCount(maxSplitters);

	}

	private int getHHCountforSplitterCount(int count) {
		return splitterRatio * count;
	}

	public int getMaxSplitters() {
		return splittersCounts.size();
	}

	public int getMinHhount() {
		return minHhCount;
	}

	public int getIdealHhCount() {
		return idealHhCount;
	}

	public int getSplitterRatio() {
		return splitterRatio;
	}

	public int getMaxHhCount() {
		return maxHhCount;
	}

	public MaterialType getMaterialType() {
		return materialType;
	}
	
	public int computeNumberOfSplitters(double requiredFiberStrands) {
		int splitterRatio = getSplitterRatio();
		return (int) Math.ceil(((double) requiredFiberStrands) / splitterRatio);
	}

}
