require 'active_record_migrations'
require 'activerecord-postgis-adapter'

unless Rails.env.production?
  require 'seed_dump'
  # SeedDump.load_tasks
end

ActiveRecordMigrations.load_tasks