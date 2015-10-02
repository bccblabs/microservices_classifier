import time, requests, pika
import numpy as np
import caffe
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
classifiers = [hdd_classifier]
print '[classifier] labels loaded ' + str (labels) 

def classifier_callback (ch, method, properties, body):
    print body
    image = caffe.io.load_image(body.tmp_path)
    resized_image = caffe.io.resize_image (image, (256,256,3))
    res = np.zeros (num_outs * len (classifiers)).reshape (num_outs, len(classifiers))
    for i, x in enumerate (classifiers):
        res[:,i] = x.predict ([resized_image])[0]
    avg_probs = np.average (res, axis=1)
    top_k_idx = avg_probs.argsort()[-1:-6:-1]
    result = [( labels[x], avg_probs[x]) for x in top_k_idx]

    url = 'http://localhost:8080/notify'
    data = {'socket_id': body.socket_id, 'classification_result': result}
    requests.post (url, data)


hdd_exchange = 'hdd'
binding_key = 'classify'
connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
channel = connection.channel()
channel.exchange_declare(exchange=hdd_exchange, type='topic')
result = channel.queue_declare(exclusive=True)
queue_name = result.method.queue
channel.queue_bind (exchange=hdd_exchange, queue=queue_name, routing_key=binding_key)

print ' [*] Waiting for image classifications'

channel.basic_consume (classifier_callback, queue = queue_name, no_ack = True)
channel.start_consuming()
