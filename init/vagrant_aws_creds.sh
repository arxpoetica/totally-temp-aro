#!/bin/bash

mkdir -p ~/.aws
scrypt dec /vagrant/ops/credentials.scrypt ~/.aws/config
chmod 600 ~/.aws/config