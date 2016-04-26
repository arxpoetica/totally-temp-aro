package com.altvil.netop;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.AbstractWebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig extends AbstractWebSocketMessageBrokerConfigurer {
	@Override
	public void configureMessageBroker(MessageBrokerRegistry config) {
		/*
		 * Enable the "simple" message broker with a bridge that forwards
		 * messages to destination "/topic/*" into the broker
		 * 
		 */
		config.enableSimpleBroker("/topic");
		
		/*
		 * Enable a filter that intercepts messages to topics beginning with
		 * '/apps/*' in order to forward them to annotated methods within the
		 * webapp's controllers.
		 */
		 config.setApplicationDestinationPrefixes("/apps");
	}

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/stomp").withSockJS();
	}
}
