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
    vb.memory = 2048
    vb.cpus = 2
  end

# Configure provisioner script
  config.vm.synced_folder 'ops/provisioner', '/tmp/provisioner'
  config.vm.provision :opsworks, type: 'shell' do |shell|
    shell.inline = '/bin/bash /tmp/provisioner/opsworks "$@"'
  end

# Create docker data container
  config.vm.synced_folder 'ops/docker', '/tmp/docker'
  config.vm.provision "docker" do |d|
    d.build_image "/tmp/docker",
      args: "-t aro-postgis"
    d.run 'postgres-data',
      image: "aro-postgis",
      args: "-v '/var/lib/postgresql/data'",
      cmd: "bash -l"
  end


  # Define application layer
  config.vm.define "app" do |layer|

    # Use docker container for local database
    layer.vm.provision "docker", run: "always" do |d|
      d.run 'postgres',
        image: "aro-postgis",
        args: "--volumes-from=postgres-data -e POSTGRES_PASSWORD=aro -e POSTGRES_USER=aro -d -p 5432:5432"
    end

    layer.vm.provision :opsworks, type: 'shell', args:[
      'ops/dna/stack.json',
      'ops/dna/app.json'
    ]

    # Forward ports
    layer.vm.network "forwarded_port", guest: 8000, host: 8000, auto_correct: true     #application: node webapp
    layer.vm.network "forwarded_port", guest: 5432, host: 5432, auto_correct: true   #postgres
  end

  
end
