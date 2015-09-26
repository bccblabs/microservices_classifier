from celery import Celery, Task
import caffe, time, caffe, requests

class NotifierClass(Task):
    abstract = True
    def after_return (self, status, retval, task_id, args, kwargs, einfo):
        url = 'http://localhost:3000/notify'
        data = {'socket_id': 0, 'classification_result': retval}
        requests.post (url, data=data)


broker = 'amqp://localhost:5672'
app = Celery (__name__, broker=broker)

@app.task
def classify_task(base=NotifierClass):
	return 'test'
