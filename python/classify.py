from celery import Celery, Task
import time, requests, pickle, caffe
import numpy as np
from caffe import Net, SGDSolver
caffe.set_mode_cpu()
caffe_root = "/home/ubuntu/caffe/"
models_root = caffe_root + "models/hdd_13_ft/"
labels = np.loadtxt(models_root + "labels.txt", str, delimiter="\t")
hdd_classifier = caffe.Classifier (
                models_root + "deploy.prototxt",
                models_root + "hdd_13_iter_25k.caffemodel",
                channel_swap = (2,1,0),
                raw_scale = 255,
                image_dims = (256, 256)
)
print '[classifier] labels loaded ' + str (labels) 


broker = 'amqp://localhost:5672'
app = Celery (__name__, broker=broker)

class NotifierTask (Task):
    abstract = True
    def after_return (self, status, retval, task_id, args, kwargs, einfo):
        url = 'http://localhost:80/notify'
        data = {'socket_id': 0, 'classification_result': retval}
        requests.post (url, data)

@app.task
def classify_task(base=NotifierTask):
	time.sleep(3)
	return 'test'
