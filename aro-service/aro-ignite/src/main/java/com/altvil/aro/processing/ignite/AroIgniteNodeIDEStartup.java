package com.altvil.aro.processing.ignite;

import org.apache.ignite.IgniteCheckedException;
import org.apache.ignite.IgniteException;
import org.apache.ignite.IgniteSpring;
import org.apache.ignite.Ignition;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.GenericXmlApplicationContext;

/**
 * Starts up an empty node with example compute configuration.
 */
public class AroIgniteNodeIDEStartup {
    /**
     * Start up an empty node with example compute configuration.
     *
     * @param args Command line arguments, none required.
     * @throws IgniteException If failed.
     * @throws IgniteCheckedException 
     */
    public static void main(String[] args) throws IgniteException, IgniteCheckedException {
    	ApplicationContext context = new GenericXmlApplicationContext("aroServices.xml");
        IgniteSpring.start("igniteConfig-serviceNode-IDE.xml", context);
    	//Ignition.start("igniteConfig-basicNode-IDE.xml");
    }
}
