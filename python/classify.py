from celery import Celery, Task
import time, requests, pickle, caffe
# from caffe import Net, SGDSolver
# caffe.set_mode_cpu()
caffe_root = "/Users/bski/Project/caffe/"
data_root = caffe_root + "data/"
# blob = caffe.proto.caffe_pb2.BlobProto()
labels = list( pickle.load (open(caffe_root + "models/trained/labels_450.p")))
# hdd_classifier = caffe.Classifier (
#                caffe_root + "models/trained/cars_450_deploy.prototxt",
#                 caffe_root + "models/trained/cars_848_ft_ss40k_iter_100000.caffemodel",
#                 channel_swap = (2,1,0),
#                 raw_scale = 255,
#                 image_dims = (256, 256)
# )
print '[classifier] labels loaded ' + str (labels) 


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
