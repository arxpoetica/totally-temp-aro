package com.altvil.authentication;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.Principal;
import java.security.SignatureException;
import java.util.Map;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import javax.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.filter.OncePerRequestFilter;

import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.JWTVerifyException;

/**
 * Authenticates web service requests then provides the user's identity to the web service endpoints.
 * 
 * @author Kevin
 *
 */
public class JwtAuthenticationFilterBean extends OncePerRequestFilter {
	private static final String HEADER = "Authorization";
	private static final String SCHEMA = "Bearer ";
	private final byte[] jwtSecret;
	
	private static final Logger LOG = LoggerFactory
			.getLogger(JwtAuthenticationFilterBean.class.getName());

	public JwtAuthenticationFilterBean(String jwtSecret) {
		this.jwtSecret = jwtSecret.getBytes(StandardCharsets.UTF_8);
	}

	@Override
	public void destroy() {
	}

	@Override
	public void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain next)
			throws IOException, ServletException {
			try {
				next.doFilter(wrap(request), response);
			} catch (InvalidKeyException | NoSuchAlgorithmException | IllegalStateException | SignatureException
					| JWTVerifyException e) {
				LOG.warn("JWT authorization failed", e);
				response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
			}
	}

	private HttpServletRequest wrap(HttpServletRequest httpServletRequest) throws InvalidKeyException,
			NoSuchAlgorithmException, IllegalStateException, SignatureException, IOException, JWTVerifyException {
		String jwtToken = httpServletRequest.getHeader(HEADER);

		if (jwtToken == null || !jwtToken.startsWith(SCHEMA)) {
			// TODO KG Throw exception to reject every rest and ws (websocket)
			// HTTP request that does not provide a valid JWT token.

			return httpServletRequest;
		}

		Map<String, Object> payload = new JWTVerifier(jwtSecret, "audience")
				.verify(jwtToken.substring(SCHEMA.length()));

		final Principal principal = new SimplePrincipal(payload.getOrDefault("sub", "").toString());

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
			}
		};
	}

//	@Override
//	public void init(FilterConfig config) throws ServletException {
//		PropertySourcesPlaceholderConfigurer configurer = WebApplicationContextUtils
//				.getRequiredWebApplicationContext(config.getServletContext())
//				.getBean(PropertySourcesPlaceholderConfigurer.class);
//		configurer.getAppliedPropertySources().forEach(propertySourceConsumer());
//	}
//
//	Consumer<? super PropertySource<?>> propertySourceConsumer() {
//		return new Consumer<PropertySource<?>>() {
//
//			@Override
//			public void accept(PropertySource<?> propertySource) {
//				if (propertySource.containsProperty("JWT_SECRET")) {
//					jwtSecret = propertySource.getProperty("JWT_SECRET").toString().getBytes(StandardCharsets.UTF_8);
//				}
//			}
//		};
//	}
}
