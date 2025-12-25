import os
import sys

# Add the parent directory to sys.path so 'from app.main import app' works correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

# Vercel looks for 'app' or 'handler' by default
handler = app
