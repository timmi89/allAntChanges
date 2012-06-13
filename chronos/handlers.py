from piston.handler import AnonymousBaseHandler
from django.http import HttpResponse, HttpResponseBadRequest
from django.db.models import Count
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from decorators import status_response, json_data, json_data_post
from exceptions import JSONException
from utils import *
from userutils import *
from authentication.token import *
from settings import BASE_URL, STATIC_URL
from django.forms.models import model_to_dict
from django.core.mail import EmailMessage
from django.db.models import Q
from chronos.jobs import *
from threading import Thread
from itertools import chain

import logging
logger = logging.getLogger('rb.standard')


class StickyTimeCountHandler(AnonymousBaseHandler):
    allowed_methods = ('GET', 'POST')

    @status_response
    @json_data_post
    def create(self, request, data):
        pass

    @status_response
    @json_data
    def read(self, request, data):
        pass   
    
    
    