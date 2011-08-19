from fabric.api import *

env.hosts = ['50.19.211.244']
env.user = 'django'
env.password = 'gubnah'

code_dir = "~/readrboard"

def commit_local():
    local("git add .")
    local("git commit -am 'deploying'")
    local("git push")

def pull_remote():
    with cd(code_dir):
        run("git pull")
        run("./manage.py collectstatic")
    sudo("apache2ctl restart")

def deploy():
    commit_local()
    pull_remote()
