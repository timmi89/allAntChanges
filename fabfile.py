from fabric.api import *

env.hosts = ['50.19.211.244']
env.user = 'django'
env.remote_dir = "/home/users/readrboard"

def commit_local():
    local("git add .")
    local("git commit -am 'deploying'")
    local("git push")

def pull_remote():
    run("cd $remote_dir")
    run("git pull")
    run("sudo apache2ctl restart")

def deploy():
    require("hosts")
    require("user")
    require("remote_dir")
    commit_local()
    pull_remote()
