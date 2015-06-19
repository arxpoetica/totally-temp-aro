# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # All Vagrant configuration is done here. The most common configuration
  # options are documented and commented below. For a complete reference,
  # please see the online documentation at vagrantup.com.

  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "ubuntu/trusty64"

  config.vm.provider "virtualbox" do |vb|
  #   # Don't boot with headless mode
  #   vb.gui = true
  #
  #   
    vb.memory = 2048
    vb.cpus = 2
  end

# Configure provisioner script
  config.vm.synced_folder 'init/ops/provisioner', '/tmp/provisioner'
  config.vm.provision :opsworks, type: 'shell' do |shell|
    shell.inline = '/bin/bash /tmp/provisioner/opsworks "$@"'
  end

  # Define application layer
  config.vm.define "app" do |layer|

    # Use docker container for local database
    layer.vm.provision "docker", run: "always" do |d|
      d.pull_images 'postgres'
      d.run 'postgres:9.4', args: "-e POSTGRES_PASSWORD=aro -e POSTGRES_USER=aro -d --name postgres -p 5432:5432"
    end

    layer.vm.provision :opsworks, type: 'shell', args:[
      'init/ops/dna/stack.json',
      'init/ops/dna/app.json'
    ]

    # Forward ports
    layer.vm.network "forwarded_port", guest: 8000, host: 8000, auto_correct: true     #application: node webapp
    layer.vm.network "forwarded_port", guest: 5432, host: 5432, auto_correct: true   #postgres
  end

  
end
