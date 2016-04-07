#!/usr/bin/python

import os

def main():
    proc = os.popen(
        "/usr/sbin/rabbitmqctl list_queues -p antenna_broker name messages consumers | grep -v utility | grep -v celeryev | grep celery | awk '{print $2;}'"
    )
    queue_size = int(proc.readline().strip())
    proc.close()

    print "celery queue size: %d" % queue_size
    if queue_size > 50:
        print "cloud_metrics restarting celery"
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
