from django.test import TestCase
from django.test.client import Client

class WidgetTest(TestCase):
	fixtures = ['test_data.json']

	def test_widget(self):
		response = self.client.get('/widget/test/')
		self.assertEqual(response.status_code, 200)