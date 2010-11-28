from django.db import models
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
import datetime

class Article(models.Model):
    inserted = models.DateField(auto_now_add=True, editable=False)
    site = models.ForeignKey(Site)

class ContentNode(models.Model):
    inserted = models.DateField(auto_now_add=True, editable=False)
    article = models.ForeignKey(Article)
