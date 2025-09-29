#!/usr/bin/env python3
"""
Multi-Modal Visual Programming Compiler Startup Script

This script handles the initialization and startup of the visual programming compiler.
It ensures proper environment setup and starts the Flask development server.
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required!")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    else:
        print(f"✅ Python version: {sys.version}")

def check_virtual_environment():
    """Check if we're running in a virtual environment"""
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("✅ Virtual environment detected")
        return True
    else:
        print("⚠️  Not running in a virtual environment")
        return False

def install_requirements():
    """Install required packages"""
    requirements_file = Path("requirements.txt")
    if not requirements_file.exists():
        print("❌ requirements.txt not found!")
        return False
    
    print("📦 Installing requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        return False

def check_environment_file():
    """Check if .env file exists and has required variables"""
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ .env file not found!")
        print("Please create a .env file with your API_KEY")
        return False
    
    # Read and check for API_KEY
    try:
        with open(env_file, 'r') as f:
            content = f.read()
            if 'API_KEY=' in content:
                print("✅ Environment file found with API_KEY")
                return True
            else:
                print("❌ API_KEY not found in .env file")
                return False
    except Exception as e:
        print(f"❌ Error reading .env file: {e}")
        return False

def start_flask_app():
    """Start the Flask application"""
    print("🚀 Starting Visual Programming Compiler...")
    print("📍 Server will be available at: http://localhost:5000")
    print("🔧 Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Set environment variables for Flask
        os.environ['FLASK_APP'] = 'app.py'
        os.environ['FLASK_ENV'] = 'development'
        
        # Import and run the Flask app
        from app import app
        app.run(host='0.0.0.0', port=5000, debug=True)
    except ImportError as e:
        print(f"❌ Failed to import Flask app: {e}")
        print("Make sure all requirements are installed")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

def main():
    """Main startup function"""
    print("=" * 60)
    print("🎨 Multi-Modal Visual Programming Compiler")
    print("=" * 60)
    
    # Change to script directory
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)
    print(f"📁 Working directory: {script_dir}")
    
    # Run startup checks
    check_python_version()
    
    if not check_virtual_environment():
        print("💡 Recommendation: Use a virtual environment for better dependency management")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            print("Setup cancelled. Please create a virtual environment first:")
            print("  python -m venv venv")
            print("  venv\\Scripts\\activate  # On Windows")
            print("  source venv/bin/activate  # On Linux/Mac")
            sys.exit(0)
    
    # Check and install requirements
    try:
        import flask
        import flask_cors
        import google.generativeai
        print("✅ All required packages are installed")
    except ImportError:
        print("📦 Installing missing requirements...")
        if not install_requirements():
            sys.exit(1)
    
    # Check environment configuration
    if not check_environment_file():
        print("\n💡 Creating sample .env file...")
        with open('.env', 'w') as f:
            f.write("API_KEY=your_gemini_api_key_here\n")
        print("✅ Sample .env file created")
        print("Please edit .env and add your actual Gemini API key")
        return
    
    print("\n🎯 All checks passed! Starting application...")
    print("-" * 60)
    
    # Start the application
    start_flask_app()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Application stopped by user")
        print("Thank you for using Visual Programming Compiler!")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)