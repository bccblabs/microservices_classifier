import json, time, requests, pika
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

def classify (file_path):
    image = caffe.io.load_image(file_path)
    resized_image = caffe.io.resize_image (image, (256,256,3))
    res = np.zeros (len (labels) * len (classifiers)).reshape (len(labels), len(classifiers))
    for i, x in enumerate (classifiers):
        res[:,i] = x.predict ([resized_image])[0]
    avg_probs = np.average (res, axis=1)
    top_k_idx = avg_probs.argsort()[-1:-6:-1]
    result_dict = {}
    result_dict['top_5'] = []
    for x in top_k_idx.tolist():
        res_dict = {}
        res_dict["class_name"] = labels.tolist()[x][0]
        res_dict["prob"] = avg_probs.tolist()[x]
        result_dict['top_5'].append (res_dict)
    result_dict['top_1'] = result_dict['top_5'][0]
    return result_dict


def classifier_callback (ch, method, properties, body):
    body = json.loads(body)
    result_dict = classify(body['file_path'])
    url = 'http://localhost:8080/notify'
    data = json.dumps({'socket_id': body['socket_id'], 'classification_result': result_dict, 'object_id': body['object_id']})
    headers = {'Content-type': 'application/json', 'Accept': 'text/plain'} 
    r = requests.post (url, data=data, headers=headers)
    print r.text




hdd_exchange = 'hdd'
binding_key = 'classify'
connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
channel = connection.channel()
channel.exchange_declare(exchange=hdd_exchange, type='topic', durable=True)
result = channel.queue_declare(exclusive=True)
queue_name = result.method.queue
channel.queue_bind (exchange=hdd_exchange, queue=queue_name, routing_key=binding_key)
print ' [*] Waiting for image classifications'
channel.basic_consume (classifier_callback, queue = queue_name, no_ack = True)
channel.start_consuming()
