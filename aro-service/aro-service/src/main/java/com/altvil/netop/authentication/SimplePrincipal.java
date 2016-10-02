package com.altvil.netop.authentication;

import java.security.Principal;

public class SimplePrincipal implements Principal {
	private final String jwtSubject;
	
	public SimplePrincipal(String jwtSubject) {
		this.jwtSubject = jwtSubject;
	}

	@Override
	public String getName() {
		return jwtSubject;
	}

	@Override
	public int hashCode() {
		return 11 + jwtSubject.hashCode();
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		SimplePrincipal other = (SimplePrincipal) obj;
		return jwtSubject.equals(other.jwtSubject);
	}
}
