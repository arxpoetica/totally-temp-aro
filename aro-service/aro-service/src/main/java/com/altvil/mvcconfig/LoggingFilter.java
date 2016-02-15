package com.altvil.mvcconfig;

import org.apache.log4j.Logger;
import org.springframework.web.filter.AbstractRequestLoggingFilter;

import javax.servlet.http.HttpServletRequest;

public class LoggingFilter extends AbstractRequestLoggingFilter {
    private final Logger logger = Logger.getLogger(this.getClass());

    public LoggingFilter() {
        setIncludePayload(true);
        setIncludeClientInfo(true);
        setIncludeQueryString(true);
    }

    @Override
    protected void beforeRequest(HttpServletRequest httpServletRequest, String s) {

    }

    @Override
    protected void afterRequest(HttpServletRequest httpServletRequest, String s) {
        logger.debug(createMessage(httpServletRequest, "Http Request: ", ""));
        logger.debug(s);
    }
}
