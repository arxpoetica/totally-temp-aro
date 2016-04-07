package com.altvil.aro.service.entity;

public enum MaterialType {

	FDT, FDH, BFT, SPLITTER_16, SPLITTER_32, SPLITTER_64,

	;

	public static MaterialType getOpticalSplitter(int count) {
		if (count > 64)
			throw new RuntimeException("No splitter exist tho handle more than 64 ratio");

		switch (roundUp(count, 16)) {
		case 4:
		case 3:
			return SPLITTER_64;
		case 2:
			return SPLITTER_32;
		default:
			return SPLITTER_16;

		}

	}

	private static int roundUp(int num, int divisor) {
		return (num + divisor - 1) / divisor;
	}

}
