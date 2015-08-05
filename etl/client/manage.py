#!/usr/bin/env python

# stdlib
from argparse import ArgumentParser

# 3p

# project
import data

# A command must have, defined a module level, an init() function
# that takes a parser object (to which subparsers may be added).
# Each module is responsible for properly setting the `func'
# default via one or more calls to ArgumentParser.set_defaults().

# See existing scripts for examples.

COMMANDS = [
    ('data', data)
]

def parse_args():
    parser = ArgumentParser()
    subparsers = parser.add_subparsers()
    for name, module in COMMANDS:
        module_parser = subparsers.add_parser(name)
        module.init(module_parser)

    options = parser.parse_args()
    return options

def main():
    options = parse_args()
    options.func(options)

if __name__ == '__main__':
    main()
