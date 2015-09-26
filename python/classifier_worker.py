from celery import Celery
import time
import caffe

broker = 'amqp://localhost:5672'
app = Celery (__name__, broker=broker)

@app.task
def classify_task():
	time.sleep(3)
	return 'test'
