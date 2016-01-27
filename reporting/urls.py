from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^/weekly_email_report$', views.weekly_email_report)
]
