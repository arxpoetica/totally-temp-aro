package com.altvil.aro.processing.ignite;

import org.apache.ignite.IgniteException;
import org.apache.ignite.Ignition;

/**
 * Starts up an empty node with example compute configuration.
 */
public class AroIgniteNodeIDEStartup {
    /**
     * Start up an empty node with example compute configuration.
     *
     * @param args Command line arguments, none required.
     * @throws IgniteException If failed.
     */
    public static void main(String[] args) throws IgniteException {
        Ignition.start("igniteConfig-basicNode-IDE.xml");
    }
}
