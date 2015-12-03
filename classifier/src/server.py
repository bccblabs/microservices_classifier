CAFFE_ROOT = "/home/ubuntu/caffe/"
import sys
sys.path.insert (0, CAFFE_ROOT + "python")
import caffe, numpy as np

from flask import Flask, request, Response, jsonify
from StringIO import StringIO
import urllib, requests, traceback, os

IMAGE_ROOT = "/tmp/"
classifier_dir="/home/ubuntu/microservices_classifier/classifier/src/"

app = Flask (__name__)
app.config.from_object (__name__)
app.config ['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

caffe.set_mode_gpu()
caffe.set_device(0)
labels = np.loadtxt(classifier_dir + "labels.txt", str, delimiter="\t")
num_outs = 525


def center_crop (img):
    img = np.rot90 (img, 3)
    width =  np.size(img,1)
    height =  np.size(img,0)
    new_width = new_height = min (width, height)
    new_height = new_width/1.5
    left = np.ceil((width - new_width)/2.)
    top = np.ceil((height - new_height)/2.)
    right = np.floor((width + new_width)/2.)
    bottom = np.floor((height + new_height)/2.)
    cImg = img[top:bottom, left:right]
    return cImg

c0 = caffe.Classifier (
                classifier_dir + "deploy.prototxt",
                classifier_dir + "cars_525.caffemodel",
                channel_swap = (2,1,0),
                raw_scale = 255,
                image_dims = (256, 256)
)
classifiers = [c0]

@app.route("/classify")
def classify():
    try:
        num_outs = 525
        image_path = request.args.get ("image_path")
        image = center_crop (caffe.io.load_image(IMAGE_ROOT + image_path))
        resized_image = caffe.io.resize_image (image, (256,256,3))
        res = np.zeros (num_outs * len (classifiers)).reshape (num_outs, len(classifiers))
        for i, x in enumerate (classifiers):
            res[:,i] = x.predict ([resized_image])[0]
        avg_probs = np.average (res, axis=1)
        top_k_idx = avg_probs.argsort()[-1:-6:-1]
        class_res = {}
        class_res['top_3'] = []
        for x in top_k_idx.tolist():
            res_dict = {}
            res_dict["class_name"] = labels.tolist()[x][0]
            res_dict["prob"] = avg_probs.tolist()[x]
            class_res['top_3'].append (res_dict)
        class_res['top_1'] = class_res['top_3'][0]
        app.logger.debug ("[classifier] classification result saved." + str(class_res.to_json()))
        response = Response (response = class_res.to_json(), status=200, mimetype="application/json")
        return response
    except:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        app.logger.error (" ".join(traceback.format_tb (exc_traceback)))
        resp = jsonify ({"msg": "Server Error"})
        resp.status_code = 500
        return resp

if __name__ == "__main__":
    if not app.debug:
        import logging
        from logging.handlers import RotatingFileHandler
        handler = RotatingFileHandler ("classifier_server.log", maxBytes=1024 * 20, backupCount=20)
        handler.setFormatter (logging.Formatter (
            '%(asctime)s %(levelname)s: %(message)s '
            '[in %(pathname)s:%(lineno)d]'
        ))
        handler.setLevel (logging.WARNING)
        app.logger.addHandler (handler)
    app.run(host="0.0.0.0")
