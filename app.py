from __future__ import absolute_import
from celery import Celery
from classify.tasks import classify
app = Celery ('classify', broker='amqp://', backend='amqp://', include=['classify.tasks'])

app.start()
