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
from oauth2client.gce import AppAssertionCredentials
from oauth2client.client import SignedJwtAssertionCredentials, GoogleCredentials

CUSTOM_METRIC_NAME = "custom.cloudmonitoring.googleapis.com/celery.queue.size"


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

  # Create a cloudmonitoring service to call. Use OAuth2 credentials.
#  credentials = AppAssertionCredentials(
#      scope="https://www.googleapis.com/auth/monitoring")

  super_secret_stuff = {
      "private_key_id": "7e472963526f79c4a8a281165b810a5f17f63a97",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCuAnG23iv1mGN6\n5hrdiaokoo97ThwF0R4DYMpGx31UyvAsw2V61eDcSe5C0HMp9WY3H7+NtI8/+oGG\nxh1Yn60mPpepUhJRFhIr1eJQ8e+feXTC+elMviIuvfMuymXhvukKuCEAukKwau9E\nKAFwJxA6brzk7qipkqZkQMWe35WIF9LnFhcvwuWlCRWB3eflg+aBMLHR5b4rX/3E\nz/d5lLbXlwgnEzUdGufYU2oZ5BXKmfQuXaRBMOndOAg7GtNvpNvwqX5sXyioDm2S\nRo10oSv/IgNy427S6j9M1MReQ0xVYe0OIk/IQ+a3ArM5MiScsybW4pBrbvpY/5Xv\n7VM403zzAgMBAAECggEAAvUzraIVKTWP61Th/AYNCFZjDfuD6m1ljzUj+xQFA133\nuysPHIlqKxRuomActQfg1usJPIVnMfU2Im5XrVv5e37w4QXuHca8RFZ8ZFfYdOOB\nopbQ6mcI+bZs3cy+8plmKLJ8jSCdZZZLvuLXM2rWkce0GkgcQdWmUmnvcgXm6stF\nslTO6hGhSCxOCB21DgJxGTLCELOtMZ19VU1qryju3GpYW9D+gQNIWFcm+84g98ed\nvk2ljpUVtLlYnRSq4pXctYI5Xj6KMN1Q6JlD61Ojtsc4uuFcj1rdsTUTMpQBQCxx\nx5CTKsUsX/rnFexjxbOAGQWKhMrLs9ZOLi0aHG0BIQKBgQDbDTII9aaFn83tvoOh\n19l/rjOsETEfgYMabHiVMs8w9DiYh/04zbeqMbE2WEQ/4yZbJ96XiYPznzIjCUG/\nH8PeJkKtS6SElWGRfxxmKcg3ZdbYv7k3XEg2PXS/eTJlkxKbgdJtrNEsWOjHRsvV\nNeG0pp3LIHRbD+8P36Q/1JpqGwKBgQDLXE16fgHd/1nm3LDetRPbL9yPTHwcwhCb\nAU28Of2XCxPNV/7uhTXjMgJqOrRXEvrUyuNGkzgn7G5guvm4GmSZvcch6SNUsrso\n2TbnRW8B1NPIUirODJiaR0VE3A6kiO3knp1jaB+8ZopHrZRXMavN/VXhtjl5c85W\nJ2483U1mCQKBgEvrZN4KFa7WVg8CKqkbIHzKKYqHYtkikAfGdHxxYbH70um6qB7Z\n3cAU/PBy4ySpW4/YX6Nxu9Ph5wSRnsHZBo+l/xIE135EL863mWYnMQdSOoZg3Ja9\nWyHBZwc9wCPIN3jCI+ZzMQQHxJXciaTZyeJMpP/TvcAZ46dCwbCFxQblAoGAJSe6\nKDU5lhv/iwSrdCVVeWinPa9VxdNXQVrdnxRhVuV5Or1nIKFKFTaf5lTPelFHbvWa\nzNw9GF5EVHwVACQiWUypQ3LbN7BoLbByLZMsEwOVpjYNCBSZFScMauZh7oHuJSUt\n0GnH0p5RiYMXZU73+uzcch7fJWeZPXh61bgBWjECgYAvdirAXmSBe8wVwz0XHfR6\nDhrHKZQGZpjrdCg/J4rM6YqKVteuzBFjU8/ELMThR+CozotXUK4k+WkZM9bbACp1\nnwQzYwg5GJF/w0QgKQmb0ppE6/nImyVnQoAVBRQRhuOA4hGiri2qZrS+4YI1fg05\nokbEHLmOpjjDxOaQBsyDWA\u003d\u003d\n-----END PRIVATE KEY-----\n",
      "client_email": "720415281400-3evindkroukvgf7tej74cje3ll8sauh5@developer.gserviceaccount.com",
      "client_id": "720415281400-3evindkroukvgf7tej74cje3ll8sauh5.apps.googleusercontent.com",
      "type": "service_account"
  }


# credentials = SignedJwtAssertionCredentials(super_secret_stuff['client_email'], super_secret_stuff['private_key'],
#   'https://www.googleapis.com/auth/monitoring')
  credentials = GoogleCredentials.get_application_default()
  credentials = credentials.create_scoped('https://www.googleapis.com/auth/monitoring')
  http = credentials.authorize(httplib2.Http())
  service = build(serviceName="cloudmonitoring", version="v2beta2", http=http)


  proc = os.popen("/usr/sbin/rabbitmqctl list_queues -p antenna_broker name messages consumers | grep -v utility | grep -v celeryev | grep celery | awk '{print $2;}'")
  queue_size = int(proc.readline().strip())
  
  # Set up the write request.
  now = GetNowRfc3339()
  desc = {"project": project_id,
          "metric": CUSTOM_METRIC_NAME}
  point = {"start": now,
           "end": now,
           "doubleValue": queue_size}
  print "Writing %d at %s" % (point["doubleValue"], now)

  # Write a new data point.
  try:
    write_request = service.timeseries().write(
        project=project_id,
        body={"timeseries": [{"timeseriesDesc": desc, "point": point}]})
    _ = write_request.execute()  # Ignore the response.
  except Exception as e:
    print "Failed to read custom metric data: exception=%s" % e
    raise  # propagate exception

  """
  # Read all data points from the time series.
  # When a custom metric is created, it may take a few seconds
  # to propagate throughout the system. Retry a few times.
  print "Reading data from custom metric timeseries..."
  read_request = service.timeseries().list(
      project=project_id,
      metric=CUSTOM_METRIC_NAME,
      youngest=now)
  start = time.time()
  while True:
    try:
      read_response = read_request.execute()
      for point in read_response["timeseries"][0]["points"]:
        print "  %s: %s" % (point["end"], point["doubleValue"])
      break
    except Exception as e:
      if time.time() < start + 20:
        print "Failed to read custom metric data, retrying..."
        time.sleep(3)
      else:
        print "Failed to read custom metric data, aborting: exception=%s" % e
        raise  # propagate exception
    """

if __name__ == "__main__":
  main()
