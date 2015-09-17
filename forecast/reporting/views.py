import tasks
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from datetime import datetime
from django.db.models import Count, Sum
from django.forms.models import model_to_dict
from django.core import serializers
from django.core.cache import cache, get_cache
from django.template import RequestContext

from antenna.authentication.token import checkCookieToken
from antenna.authentication.decorators import requires_admin, requires_admin_super
from antenna.api.decorators import status_response, json_data
import logging, json
logger = logging.getLogger('rb.standard')