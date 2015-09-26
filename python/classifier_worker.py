from celery import Celery, Task
import time
import requests
import caffe

broker = 'amqp://localhost:5672'
app = Celery (__name__, broker=broker)

class NotifierTask (Task):
    abstract = True
    def after_return (self, status, retval, task_id, args, kwargs, einfo):
        url = 'http://localhost:80/notify'
        # needs to retrieve the id from mq msg, leave out here
        data = {'socket_id': 0, 'classification_result': retval}
        requests.post (url, data)

@app.task
def classify_task(base=NotifierTask):
	time.sleep(3)
	return 'test'
