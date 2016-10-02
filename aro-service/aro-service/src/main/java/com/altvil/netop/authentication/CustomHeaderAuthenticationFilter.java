package com.altvil.netop.authentication;

import java.io.IOException;
import java.security.Principal;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

/**
 * Provides the user's identity for web service endpoints.
 * 
 * @author Kevin
 *
 */
public class CustomHeaderAuthenticationFilter implements Filter {
	private static final String IDENTITY = "Altman-Identity";
	@Override
	public void destroy() {
	}
	
	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain next)
			throws IOException, ServletException {
		if (request instanceof HttpServletRequest) {
			next.doFilter(wrap ((HttpServletRequest) request), response);
		} else {		
			next.doFilter(request, response);
		}
	}
	
	private HttpServletRequest wrap(HttpServletRequest httpServletRequest) {
		String identity = httpServletRequest.getHeader(IDENTITY);
		
		if (identity != null) {
			final Principal principal = new SimplePrincipal(identity);
			
			return new HttpServletRequestWrapper(httpServletRequest) {
				@Override
				public String getRemoteUser() {
					return principal.getName();
				}

				@Override
				public boolean isUserInRole(String role) {
					return false;
				}

				@Override
				public Principal getUserPrincipal() {
					return principal;
				}};
		}
		
		return httpServletRequest;
	}

	@Override
	public void init(FilterConfig config) throws ServletException {
	}
}
