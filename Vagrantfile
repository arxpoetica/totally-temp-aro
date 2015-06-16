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
  config.vm.synced_folder 'devInit/ops/provisioner', '/tmp/provisioner'
  config.vm.provision :opsworks, type: 'shell' do |shell|
    shell.inline = '/bin/bash /tmp/provisioner/opsworks "$@"'
  end

  # Define application layer
  config.vm.define "app" do |layer|

    # Use docker container for local database
    layer.vm.provision "docker", run: "always" do |d|
      d.pull_images 'postgres'
      d.run 'postgres:9.4', args: "-e POSTGRES_PASSWORD=cmo -e POSTGRES_USER=cmo -d --name postgres -p 5432:5432"
    end

    layer.vm.provision :opsworks, type: 'shell', args:[
      'devInit/ops/dna/stack.json',
      'devInit/ops/dna/flask-app.json'
    ]

    # Forward ports
    layer.vm.network "forwarded_port", guest: 80, host: 8080, auto_correct: true     #application: nginx/uwsgi
    layer.vm.network "forwarded_port", guest: 5000, host: 5000, auto_correct: true   #application: python debug
    layer.vm.network "forwarded_port", guest: 5432, host: 5432, auto_correct: true   #postgres
  end

  
end
