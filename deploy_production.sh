#!/bin/bash
#
# Usage:
#   ./deploy_production.sh
#

######################### WARNING #########################
# If you have forked this project, this will obviously not
# work. Please adapt to whatever makes sense for your own
# server environment. You should also modify src/.htaccess
###########################################################

# Notes on rsync options used:
#
#   -r: recursive
#   -t: preserve modification times
#   -v: verbose
#   -z: compress file data during transfer
#   -e 'ssh': specify the remote shell to use, in this case 'ssh'
#
#   When transfering a new file/folder, the file permissions will be the default specified in our .bashrc (705/604)
#   When updating an existing file, the file permissions of the existing remote file will be preserved. If instead,
#   we want to explicitly set file permissions to use for both new files and updated files, we'd add the following options:
#   -p: explicitly set permission as specified by input file
#   --chmod: do as if the input files have the given permission. For 705/604: --chmod=Du=rwx,Dg=,Do=rx,Fu=rw,Fg=,Fo=r
#

read -p "WARNING! This will deploy to production. Are you sure? (y/n) " -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    rsync -rtvz -e 'ssh' src/ covid19comparator:covid19comparator
fi
echo ""
