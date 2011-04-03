from exceptions import JSONException

def JSONStatusResponse(func):

    def wrapper(*args, **kwargs):
        res = {"status": 'success'}
        try:
            data = func(*args, **kwargs)
        except JSONException as error:
            res['status'] =  'Failure';
            res['message'] = error.msg;
        else:
            res['data'] = data
        return res
    return wrapper