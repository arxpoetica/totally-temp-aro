package com.altvil.utils;

public class UnitUtils {

	public static final double metersPerFeet = 0.3048;
	public static final double feetPerMeters = 3.28084;

	public static double toMeters(double feet) {
		return feet * metersPerFeet;
	}

	public static double toFeet(double meters) {
		return meters * feetPerMeters;
	}

}
