import base64
import json

jwt_payload = 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbWZkbHdyZXh1ZXlyenZ3c2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzQ1MzYsImV4cCI6MjA4OTI1MDUzNn0'
decoded = base64.b64decode(jwt_payload + '==')
print(decoded.decode('utf-8'))
