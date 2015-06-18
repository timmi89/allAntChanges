from exceptions import JSONException
# from _mysql_exceptions import OperationalError
import json
from django.core.exceptions import *
import traceback

import logging
logger = logging.getLogger('rb.standard')


def status_response(func):
    def wrapper(*args, **kwargs):
        res = {"status": 'success'}
        try:
            dataout = func(*args, **kwargs)
        except JSONException as error:
            res['status'] =  'fail'
            res['message'] = error.msg
            logger.debug( error.msg )
            logger.debug( traceback.format_exc())
        except KeyError as error:
            res['status'] = 'fail'
            res['message'] = error.message
            logger.debug(traceback.format_exc())
        except ObjectDoesNotExist as error:
            res['status'] = 'fail'
            res['message'] = error
            logger.debug(traceback.format_exc())
        # except DoesNotExist as error:
        #     res['status'] = 'fail'
        #     res['message'] = error
        except Exception as error:
            res['status'] =  'fail'
            res['message'] = error
            logger.debug(traceback.format_exc())
            #res['stack'] = traceback.format_exc()
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

def json_data_post(func):
    def wrapper(self, request, *args, **kwargs):
        try:
            data = json.loads(request.POST['json'])
        except KeyError:
            raise JSONException("No data dude! -- data must be passed in a json object")
        except ValueError:
            raise JSONException("Could not parse JSON")
        except:
            raise JSONException("Shit went down trying to get that JSON bro")
        
        return func(self, request, data, *args, **kwargs)
    return wrapper

