#!/bin/sh

# This script will set up a git pre-commit hook that will check for code quality issues.
# This script has to be run only once, when you clone the repository. The script and the hook
# will work on Linux and Mac systems. If you are on Windows, you will have to get into
# a unix-like environment like "Ubuntu for Windows", cygwin, etc.

# Get the folder that the script directory is running in
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ARO_PLATFORM_ROOT=$SCRIPT_DIR/..

# If an existing symlink exists, delete it
[ ! -f $ARO_PLATFORM_ROOT/.git/hooks/pre-commit ] || unlink $ARO_PLATFORM_ROOT/.git/hooks/pre-commit

# Create the pre-hook symlink
ln -s $ARO_PLATFORM_ROOT/git-hooks/pre-commit.sh $ARO_PLATFORM_ROOT/.git/hooks/pre-commit
