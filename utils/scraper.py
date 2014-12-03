from lxml import html
import requests
from rb.models import *

def get_html_tree(url):
    page = requests.get(url)
    return html.fromstring(page.text)


def check_page_image(tree, group):
    #look for og:image by default.  check group settings
    pass

def guess_content_well(tree, group):
    pass

def container_hashes(tree):
    #return list of container hashes
    pass


def content_hash(tree_node):
    pass
