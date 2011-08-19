from fabric.api import *

env.hosts = ['50.19.211.244']
env.user = 'django'

code_dir = "~/readrboard"

def commit_local():
    local("git add .")
    local("git commit -am 'deploying'")
    local("git push")

def pull_remote():
    with cd(code_dir):
        run("git pull")
    sudo("apache2ctl restart")

def deploy():
    require("hosts")
    require("user")
    commit_local()
    pull_remote()
