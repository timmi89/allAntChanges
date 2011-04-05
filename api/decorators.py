from exceptions import JSONException
import json

def status_response(func):

    def wrapper(*args, **kwargs):
        res = {"status": 'success'}
        try:
            data = func(*args, **kwargs)
        except JSONException as error:
            res['status'] =  'fail';
            res['message'] = error.msg;
        else:
            res['data'] = data
        return res
    return wrapper

def json_data(func):

    def wrapper(*args, **kwargs):
        data = json.loads(request.GET['json'])
        return func(*args, **kwargs)
    return wrapper

