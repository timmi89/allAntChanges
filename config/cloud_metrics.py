#!/usr/bin/python
"""Writes and reads a lightweight custom metric.

This is an example of how to use the Google Cloud Monitoring API to write
and read a lightweight custom metric. Lightweight custom metrics have no
labels and you do not need to create a metric descriptor for them.

Prerequisites: Run this Python example on a Google Compute Engine virtual
machine instance that has been set up using these intructions:
https://cloud.google.com/monitoring/demos/setup_compute_instance.

Typical usage: Run the following shell commands on the instance:
    python write_lightweight_metric.py
    python write_lightweight_metric.py
    python write_lightweight_metric.py
"""

import os
import time

from apiclient.discovery import build
import httplib2
from oauth2client.client import GoogleCredentials

CUSTOM_METRIC_TYPE = "custom.googleapis.com/celery.queue.size"


def GetProjectId():
    """Read the numeric project ID from metadata service."""
    http = httplib2.Http()
    resp, content = http.request(
        ("http://metadata.google.internal/"
         "computeMetadata/v1/project/numeric-project-id"),
        "GET", headers={"Metadata-Flavor": "Google"})
    if resp["status"] != "200":
        raise Exception("Unable to get project ID from metadata service")
    return content


def GetNowRfc3339():
    """Give the current time formatted per RFC 3339."""
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def main():
    project_id = GetProjectId()

    credentials = GoogleCredentials.get_application_default()
    credentials = credentials.create_scoped(
        'https://www.googleapis.com/auth/monitoring'
    )
    http = credentials.authorize(httplib2.Http())
    service = build(serviceName="cloudmonitoring", version="v3", http=http)

    proc = os.popen(
        "/usr/sbin/rabbitmqctl list_queues -p antenna_broker name messages consumers | grep -v utility | grep -v celeryev | grep celery | awk '{print $2;}'"
    )
    queue_size = int(proc.readline().strip())
    proc.close()

    # Set up the write request.
    now = GetNowRfc3339()
    print "cloud_metrics writing queue size %d at %s" % (queue_size, now)
    body = {
        "timeSeries": [
            {
                "metricKind": "GAUGE",
                "metric": {
                    "type": CUSTOM_METRIC_TYPE
                },
                "points": [
                    {
                        "interval": {
                            "endTime": now
                        },
                        "value": {
                            "int64Value": queue_size
                        }
                    }
                ]
            }
        ]
    }

    # Write a new data point.
    try:
        write_request = service.timeseries().create(
            name="projects/{0}".format(project_id),
            body=body)
        write_request.execute()  # Ignore the response.
        print "cloud_metrics timeseries successfully written"
    except Exception as e:
        print "cloud_metrics failed to write custom metric data: exception=%s" % e
        raise  # propagate exception

    if queue_size > 50:
        print "cloud_metrics restarting celery: queue_size=%d" % queue_size
        os.putenv('PYTHONPATH', '/home/broadcaster')
        res_proc = os.popen(
            "su broadcaster --preserve-environment -c /home/broadcaster/antenna/restart_celery.sh"
        )
        res_proc.close()
        curl_command = "curl -X POST --data-urlencode 'payload={{\"channel\": \"#system_alerts\", \"username\": \"webhookbot\", \"text\": \"Restarting Celery. (queue size: {0})\", \"icon_emoji\": \":rabbit:\"}}' https://hooks.slack.com/services/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".format(queue_size)
        slack_proc = os.popen(
            curl_command
        )
        slack_proc.close()


if __name__ == "__main__":
    main()
