class FBException(Exception):
    def __init__(self, value):
        self.value = value
    def __str__(self):
        return repr(self.value)

class JSONException(Exception):
    def __init__(self, msg):
        self.msg = msg