from fabric.api import *

env.hosts = ['aws']
env.remote_dir = "~/readrboard"

def commit_local():
    local("git add .")
    local("git commit -am 'deploying'")
    local("git push")

def pull_remote():
    run("git pull")
    run("sudo apache2ctl restart")

def deploy():
    commit_local()
    pull_remote()
