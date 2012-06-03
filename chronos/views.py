from itertools import groupby
from rb.models import *
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from datetime import datetime
from django.db.models import Count, Sum
from django.core import serializers
from piston.handler import AnonymousBaseHandler
from settings import DEBUG, FACEBOOK_APP_ID
from authentication.decorators import requires_admin, requires_access_key
from django.template import RequestContext
from authentication.token import checkCookieToken


import logging
logger = logging.getLogger('rb.standard')


@requires_access_key
def main(request, job_name=None, **kwargs):
    context = {}
    

    return render_to_response(
        "chronos.html",
        context,
        context_instance=RequestContext(request)
    )
    
def agreements(request, context, **kwargs):
    pass
    