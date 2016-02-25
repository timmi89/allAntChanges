from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.index, name='demo-index'),
    url(r'^(.+)$', views.show, name='demo-show')
]
