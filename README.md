# jelly-donut
(ARO Platform)


## Environment Setup
Instructions for building, configuring, and managing your local development environment are found in the [init folder README](init/README.md).

## Makefile commands
The application is managed through the makefile, which exposes a number of commands.

#### ETL

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
