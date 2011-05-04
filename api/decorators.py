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

    def wrapper(self, request, **kwargs):
        data = {}
        if(request):
            data = json.loads(request.GET['json'])
        return func(self, request, **data)
    return wrapper

