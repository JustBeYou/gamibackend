pathName = 'queue'

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import storage
from requests import post

cred = credentials.Certificate('./serviceAccountKey.json')
firebase_admin.initialize_app(cred)

queue = firestore.client().collection(pathName)
url = 'http://localhost:5000/gamibackend/us-central1/fileFinish'
bucket = storage.bucket('gamibackend_files')

def report_finished_processing(id):
    post(url, headers = {'token': 'vm_token'}, json = {'data': {'id': id}})

def process_file(filename, type):
    input_filename = 'processing_' + filename
    
    blob = bucket.get_blob(filename)
    blob.download_to_filename(input_filename)

    output_filename = transform(input_filename, type)

    blob.upload_from_filename(output_filename)

def transform(filename, type):
    if type in transformations:
        return transformations[type](filename)
    else:
        raise Exception("Unimplemented for type {}".format(type))

def transform_text(filename):
    output_filename = 'done_' + filename

    content = open(filename).read()    
    with open(output_filename, 'w') as f:
        f.write(content + '\nThis was processed by text transformer\n')
        f.flush()

    return output_filename

transformations = {
    'text': transform_text
}

while True:
    try:
        snapshot = next(queue.limit(1).get())
    except:
        break

    data = snapshot.to_dict()
    process_file(data['filename'], data['type'])
    report_finished_processing(data['id'])
    queue.document(snapshot.id).delete()
    break