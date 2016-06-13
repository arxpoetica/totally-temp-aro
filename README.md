# jelly-donut
(ARO Platform)

## Important notes for Colt Setup

I recommend cloning this branch into an entirely new project/subfolder, rather than switching back and forth between branches.
The basic setup remains the same (follow instructions in the [init folder README](init/README.md) up to the point where you SSH into the Vagrant box.

At that point, you must perform the following two tasks:

 - Decrypt and install AWS credentials for accessing source files in S3: `init/vagrant_aws_creds.sh` and enter the secret password you've been given.
 - when prompted for a password, enter the secret password you have been given
 - ETL for Colt: `make etl_reload_all`

 Then resume the process as described in the init README.

## Environment Setup
Instructions for building, configuring, and managing your local development environment are found in the [init folder README](init/README.md).

## Makefile commands
The application is managed through the makefile, which exposes a number of commands.

#### ETL

First of all choose an etl directory such as `cd etl-aro` or `cd etl-colt`. Then you can run the following targets:

 - `make etl_tiger_cousub`: Retrieve and load selected county subdivisions from TIGER
 - `make etl_tiger_edges`: Retrieve and load selected edges from TIGER
 - `make etl_tiger`: Retrieve and load all currently supported TIGER data
 - `make etl_aro`: Create aro objects from previously loaded TIGER objects (assumes tiger objects are already populated)

#### Data Management
 - `make reset_tiger`: Drops all TIGER related objects and extensions, then reenables the `tiger_geocoder` extension which generates the `tiger` schema full of empty parent tables for all TIGER data types
 - `make reset_aro`: Drops all `aro` tables and schemas, then recreates an empty `aro` schema

#### Setup
 - `make etl_reload_all`: Drops all data from the database, then runs all existing ETL scripts to download and import the data.

#### Application
 - `make webapp`: Installs required node modules specified in `app/package.js`
 - `make test`: Runs mocha testing suite as defined in `app/package.js`
 - `make webserver`: Starts the express webserver to server the applciation in `app/app.js`

#### Application development
Frontend JavaScripts are preprocessed by `babel`. There are two npm scripts that you can use to preprocess them easily:
 - `cd app && npm run build` builds all the frontend JavaScript files.
 - `cd app && npm run watch` builds all the frontend JavaScript files and watches for changes to rebulid files as they are changed.

#### Create users
To start using the web application you will need to create at least a user. You can do su with a builtin command line tool. Example:

```
node app/cli/register_user.js -f John -l Smith -e john@example.com -p foobar
```

#### Testing

There's a `make test` task that can be run as described before that will run the unit tests for the backend code.

However there are a few other command that we can run:
- `cd app && npm run test-cov`. Runs backend unit tests generating a coverage report.
- `cd app && npm run test-ui`. Runs unit tests on the UI code.
- `cd app && npm run test-integration`. Runs integration tests.

If you get this error while running integration tests `[launcher] Error: Error: Could not find chromedriver` that means you need to update WebDriver:

```
cd app && node_modules/protractor/bin/webdriver-manager update
```

That is usually only required the first time you run the integration tests.

Note about UI testing: these tests run in real browsers you they are not expected to work on basic VMs such as Vagrant.
