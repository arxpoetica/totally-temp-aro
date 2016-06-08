package com.altvil.netop;

import java.security.Principal;

public class DummyRequester implements Principal {

	public static final Principal PRINCIPAL = new DummyRequester();

	@Override
	public String getName() {
		return "demo";
	}

}
