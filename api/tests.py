from django.test import TestCase
from django.test.client import Client
import json

hashes = [
	"cf3677ffb09818b086bc3d6dd53eb1f4",
	"d49d05f18369db62f52680c13a75507e",
	"f7eda37fadd84ce1425ff3f77b65d85a",
]

content = [
	"Content 1",
	"Content 2",
	"Content 3"
]

class APITest(TestCase):
	fixtures = ['test_data.json']

	def test_settings(self):
		# Test success if group specified
		response = self.client.get('/api/settings/1/')
		self.assertEqual(response.status_code, 200)

		data = json.loads(response.content)
		self.assertEqual(data['status'], 'success')

	def test_create_page(self):
		response = self.client.get(
			'/api/page/',
				{
					'canonical_url': 'testhost/testpage/best/',
					'group_id':	1,
					'url': 'testhost/testpage/articles/1'
				}
			)
		self.assertEqual(response.status_code, 200)

		data = json.loads(response.content)
		self.assertEqual(data['status'], 'success')

	def test_page_data(self):
		response = self.client.get('/api/page/',
			{
				'canonical_url': '/testpage/best/',
				'group_id': 1,
				'url': '/testpage/articles/1'
			})
		self.assertEqual(response.status_code, 200)

		data = json.loads(response.content)
		self.assertEqual(data['status'], 'success')

	def test_containers(self):
		response = self.client.get('/api/containers/',
			{"json": json.dumps(
				{
				"short_name": "testpub",
				"pageID": 1,
				"hashes": hashes
				})
			}
		)
		self.assertEqual(response.status_code, 200)

		data = json.loads(response.content)
		self.assertEqual(data['status'], 'success')
		self.assertEqual(data['data']['known'], {})
		self.assertEqual(len(data['data']['unknown']), 15)

"""
	def test_containers_create(self):
		response = self.client.get('/api/containers/create',
			{"json": json.dumps(
				{
				"short_name": "testpub",
				"pageID": 1,
				"hashes": hashes
				})
			}
		)
"""