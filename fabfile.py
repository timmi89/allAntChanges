from fabric.api import *

env.hosts = ['aws']
env.remote_dir = "~/readrboard"

def commit_local():
    local("git add -p")
    local("git commit -am 'deploying'")
    local("git push")

def pull_remote():
    remote("git pull")
    remote("sudo apache2ctl restart")

def deploy():
    commit_local()
    deploy_remote()
