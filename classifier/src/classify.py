import json, time, requests, pika, os
import numpy as np
import caffe
from caffe import Net, SGDSolver
# classifier_dir = '/home/src/'

classifier_dir="/Users/bski/Dev/microservices_classifier/classifier/src/"
NOTIFIER_URI = os.environ['NOTIFIER_URI'] 
NOTIFIER_PORT = os.environ['NOTIFIER_PORT']
AMQP_HOST = os.environ['AMQP_HOST']
caffe.set_mode_cpu()
# caffe.set_device(0)

labels = np.loadtxt(classifier_dir + "labels.txt", str, delimiter="\t")
hdd_classifier = caffe.Classifier (
                classifier_dir + "deploy.prototxt",
                classifier_dir + "cars_525.caffemodel",
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
    url = NOTIFIER_URI + ':' + NOTIFIER_PORT + '/notify'
    data = json.dumps({'socket_id': body['socket_id'], 'classification_result': result_dict, 'object_id': body['object_id']})
    headers = {'Content-type': 'application/json', 'Accept': 'text/plain'} 
    r = requests.post (url, data=data, headers=headers)



try:
    cars_ex = 'cars'
    binding_key = 'classify'
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=AMQP_HOST))
    channel = connection.channel()
    channel.exchange_declare(exchange=cars_ex, type='topic', durable=True)
    result = channel.queue_declare(exclusive=True)
    queue_name = result.method.queue
    channel.queue_bind (exchange=cars_ex, queue=queue_name, routing_key=binding_key)
    print (' [*] Waiting for image classifications')
    channel.basic_consume (classifier_callback, queue = queue_name, no_ack = True)
    channel.start_consuming()
except:
    print (' [err] connecting amqp server')