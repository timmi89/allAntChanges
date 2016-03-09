import os
import mimetypes

from django.http import Http404
from django.shortcuts import render
from django.http.response import HttpResponse

index_path = 'index.html'

module_path = os.path.dirname(os.path.abspath(__file__))
pages_path = os.path.join(module_path, 'templates/demo/pages')

pages = []
for page in os.listdir(pages_path):
    if page.endswith('.html'):
        pages.append(page)
    elif os.path.isfile(os.path.join(pages_path, page, index_path)):
        pages.append(page + '/')


def index(request):
    '''
    Render a list of available demo pages
    '''

    return render(request, 'demo/index.html', {'pages': pages})


def show(request, path):
    '''
    Render the given page path
    '''

    try:
        # Santitize path
        path = os.path.normpath('/' + path).lstrip('/')
        if path.endswith(('.html', '.css', '.js')):
            response = render(
                request,
                os.path.join(pages_path, path),
                content_type=content_type(path)
            )
            return response
        elif(
            os.path.isdir(os.path.join(pages_path, path)) and
            os.path.isfile(os.path.join(pages_path, path, index_path))
        ):
            response = render(
                request,
                os.path.join(pages_path, path, index_path)
            )
            return response
        else:
            return HttpResponse(
                open(os.path.join(pages_path, path), 'rb'),
                content_type=content_type(path)
            )
    except IOError:
        raise Http404('unknown path')


def content_type(path):
    if path.endswith('.html'):
        return 'text/html'
    elif path.endswith('.js'):
        return 'text/javascript'
    elif path.endswith('.css'):
        return 'text/css'
    elif path.endswith('.svg'):
        return 'image/svg+xml'
    else:
        mtype, encoding = mimetypes.guess_type(path)
        return mtype
