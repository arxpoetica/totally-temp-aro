package com.altvil.aro.service;

public class AroException extends RuntimeException {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public AroException() {
		super();
	}

	public AroException(String message, Throwable cause) {
		super(message, cause);
	}

	public AroException(String message) {
		super(message);
	}

	public AroException(Throwable cause) {
		super(cause);
	}

}
