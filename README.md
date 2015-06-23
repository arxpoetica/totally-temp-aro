## Setup
### Global
0. Install Virual Box and Vagrant. 
1. Navigate to the ARO root directory. This contains /app, /etl, and /init subdirectories.
2. `cp init/Vagrantfile.sample Vagrantfile`
3. `vagrant up`
4. `vagrant ssh`
5. Once connected to the Vagrant box via `vagrant ssh`, `cd /vagrant`
6. `cd init` (you MUST run the init script while in the /vagrant/init directory in order for this to complete successfully...)
7. `bash init.sh` (Installs global dependencies, sets up database, adds PostGIS and pgRouting extensions)

### Database
1. From the ARO root directory (`/vagrant` when connected to the virtual box), `cd etl`
2. There are several directories in the `etl` directory - one for each data source currently supported by the application:
* TIGER county subdivisions
* TIGER edges (road segments)
3. In each data source directory, run `bash *.sh`

### Application
1. From the ARO root directory, `cd app`
2. `npm install` (maybe `sudo npm install` if that fails)
3. To run the app on localhost (from the `app` directory): `node app.js`
4. Visit http://localhost:8000 in your browser. The app should now be running.

## Tests
### Running Application Tests
1. `cd app`
2. `npm test` (this calls `mocha --recursive` as specified in `package.json`)
