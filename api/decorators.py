from exceptions import JSONException
# from _mysql_exceptions import OperationalError
import json

def status_response(func):
    def wrapper(*args, **kwargs):
        res = {"status": 'success'}
        try:
            dataout = func(*args, **kwargs)
        except JSONException as error:
            res['status'] =  'fail'
            res['message'] = error.msg
        except Exception as error:
            res['status'] =  'fail'
            #res['message'] = error.msg
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
        except ValueError:
            raise JSONException("Could not parse JSON")
        except:
            raise JSONException("Shit went down trying to get that JSON bro")
        
        return func(self, request, data, *args, **kwargs)
    return wrapper