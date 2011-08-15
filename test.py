for site in orm.Site.objects.all():
    site.twitter = site.group.twitter
    site.logo_url_sm = site.group.logo_url_sm
    site.logo_url_med = site.group.logo_url_med
    site.logo_url_lg = site.group.logo_url_lg
    site.save()