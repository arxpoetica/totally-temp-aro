package com.altvil.netop.authentication;

import java.security.Principal;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

/**
 * Provides the user's identity when connecting a web socket
 * 
 * @author Kevin
 *
 */
@Component("wsCustomAuthenticationHandshake")
public class CustomAuthenticationHandshake extends DefaultHandshakeHandler {
	private static final String IDENTITY = "altmanIdentity=";

	@Override
	protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler,
			Map<String, Object> attributes) {
		Principal p = super.determineUser(request, wsHandler, attributes);
		
		if (p != null) {
			return p;
		}
		
		String query = request.getURI().getQuery();
		if (query != null) {
			Optional<String> identity = Arrays.stream(query.split("&"))
					.filter((s) -> s.startsWith(IDENTITY)).map((s) -> s.substring(IDENTITY.length())).findAny();

			if (identity.isPresent()) {
				return new SimplePrincipal(identity.get());
			}
		}

		return null;
	}
}
