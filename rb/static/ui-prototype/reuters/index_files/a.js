KRUX.configOnload({
  "publisher": {
    "name": "Thomson Reuters"
  },
  "blocklist": [],
  "tags": [
    {
      "provider_id": 2,
      "format": "0x0",
      "value": "0.00",
      "id": 167,
      "tier": 1,
      "html": "<script>\r\n/*  fire the request for the user if required.\r\n * Cached for 1 hour.\r\n *\r\n * https://sites.google.com/a/bizo.com/api-docs/documentation/bizaudience-api\r\n*/\r\nKRUX.Provider.bizo = KRUX.clone(KRUX.Provider.base);\r\nKRUX.Provider.bizo.id = 'bizo';\r\nKRUX.Provider.bizo.uuid = '890a6228-04af-4630-85b6-0b49dee6157f';\r\nKRUX.Provider.bizo.checkForNew = 3600;\r\nKRUX.Provider.bizo.checkForUpdate = 3600;\r\nKRUX.Provider.bizo.httpMethod = 'image';\r\n\r\nKRUX.Provider.bizo.getUrl = function() {\r\n    return 'http://api.bizographics.com/v1/profile.redirect?' + KRUXHTTP.buildQueryString({\r\n        'api_key': '595bae8dbc0c4c42b4544e688b10c002',// KRUX's api key\r\n        'callback_url': KRUX.Provider.serviceUrl(this.uuid)\r\n    });\r\n};\r\nKRUX.Provider.bizo.run();\r\n</script>",
      "timing": "asap",
      "method": "script",
      "tag_type": "provider"
    },
    {
      "format": "0x0",
      "value": "0.00",
      "method": "script",
      "timing": "asap",
      "html": "<script type=\"text/javascript\">\r\n  KRUX.loadSegments()\r\n</script>",
      "tier": 1,
      "id": 163,
      "tag_type": "publisher"
    },
    {
      "format": "0x0",
      "value": "None",
      "method": "script",
      "timing": "asap",
      "html": "<script>\r\nKRUX.afterLoadCallback(function(){\r\n  // Page attributes\r\n  KRUX.pageAttribute('dartZone', KRUX.metaTag(\"DCSext.DartZone\"));\r\n  KRUX.pageAttribute('rChannel', KRUX.metaTag(\"DCSext.rChannel\"));\r\n  KRUX.pageAttribute('CMS_website', KRUX.metaTag(\"DCSext.rCountry\"));\r\n  KRUX.pageAttribute('ContentGroup', KRUX.metaTag(\"WT.cg_n\"));\r\n  KRUX.pageAttribute('ContentSubGroup', KRUX.metaTag(\"WT.cg_s\"));\r\n  KRUX.pageAttribute('ContentChannel', KRUX.metaTag(\"DCSext.ContentChannel\"));\r\n  KRUX.pageAttribute('ContentType', KRUX.metaTag(\"DCSext.ContentType\"));\r\n  KRUX.pageAttribute('DustChannels', KRUX.metaTag(\"DCSext.ChannelList\"));\r\n  KRUX.pageAttribute('ContentRevDate', KRUX.metaTag(\"REVISION_DATE\"));\r\n  KRUX.pageAttribute('ContentID', KRUX.metaTag(\"DCSext.ContentID\"));\r\n  KRUX.pageAttribute('PageNumber', KRUX.metaTag(\"DCSext.PageNumber\"));\r\n  KRUX.pageAttribute('PagesTotal', KRUX.metaTag(\"DCSext.PageTotal\"));\r\n  KRUX.pageAttribute('VideoType', KRUX.metaTag(\"DCSext.VideoType\"));\r\n  KRUX.pageAttribute('ContentCreateDate', KRUX.metaTag(\"CREATION_DATE\"));\r\n  KRUX.pageAttribute('ContentCommentNumb', KRUX.metaTag(\"DCSext.Comments\"));\r\n  KRUX.pageAttribute('DustResult', KRUX.metaTag(\"DCSext.VBC\"));\r\n  KRUX.pageAttribute('ContentHeadline', unescape(KRUX.metaTag(\"DCSext.ContentHeadline\")));\r\n  KRUX.pageAttribute(\"PageKeywords\", KRUX.metaTag(\"keywords\"));\r\n  KRUX.pageAttribute(\"PageDescription\", KRUX.metaTag(\"description\"));\r\n  KRUX.pageAttribute(\"PageTitle\", document.title);\r\n  // User Attributes\r\n  KRUX.userAttribute(\"Reg_UserID\", KRUXHTTP.cookie(\"ruus\"));\r\n  KRUX.userAttribute(\"LoginState\", KRUXHTTP.cookie(\"login\"));\r\n  KRUX.userAttribute(\"Resolution\", KRUX.is.res);\r\n\r\n  // Pull user attributes from WT_FPC cookie\r\n  var wt = KRUXHTTP.cookie(\"WT_FPC\");\r\n  if (! wt) {\r\n    return;\r\n  }\r\n  var m = wt.match(/id=([^:]+)/);\r\n  m && KRUX.userAttribute(\"WT_FPCid\", m[1]);\r\n  m = wt.match(/lv=([^:]+)/);\r\n  m && KRUX.userAttribute(\"WT_FPClv\", m[1]);\r\n  m = wt.match(/ss=([^:]+)/);\r\n  m && KRUX.userAttribute(\"WT_FPCss\", m[1]);\r\n\r\n  // Pull the site, section, sub section from the dart zone\r\n  var m2 = KRUX.metaTag('DCSext.DartZone');\r\n  if (m2) {\r\n          var s = KRUX.DART.parseZone(m2.replace(/\\/article$/, ''));\r\n          for (var name in s) {\r\n              switch(name){\r\n                case 'site': KRUXSetup.site = s[name]; break;\r\n                case 'section': KRUXSetup.section = s[name]; break;\r\n                case 'subSection': KRUXSetup.subSection = s[name]; break;\r\n              }\r\n          }\r\n  }\r\n});\r\n</script>",
      "tier": 1,
      "id": 128,
      "tag_type": "publisher"
    }
  ],
  "segments": [],
  "version": 14,
  "msg": "Control Tag configuration file for Thomson Reuters, version 14, published on 2011-06-03 07:53:39"
});