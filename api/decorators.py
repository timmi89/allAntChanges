from exceptions import JSONException
import json

def status_response(func):
    def wrapper(*args, **kwargs):
        res = {"status": 'success'}
        try:
            dataout = func(*args, **kwargs)
        except JSONException as error:
            res['status'] =  'fail';
            res['message'] = error.msg;
        else:
            res['data'] = dataout
        return res
    return wrapper

def json_data(func):
    def wrapper(self, request, *args, **kwargs):
        try:
            data = json.loads(request.GET['json'])
        except KeyError:
            raise JSONException("No data dude! -- data must be passed in a json object")
        else:
            return func(self, request, data, *args, **kwargs)
    return wrapper