#!/usr/bin/env python3
import time
import subprocess
import webbrowser
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def check_console_errors():
    print("🔍 Checking for console errors in Adelynn's Jungle Dash...")
    
    # Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1200,800")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    try:
        # Start browser
        driver = webdriver.Chrome(options=chrome_options)
        driver.get("http://localhost:8001")
        
        # Wait for page to load
        time.sleep(3)
        
        # Get console logs
        logs = driver.get_log('browser')
        
        print(f"\n📊 Found {len(logs)} console messages:")
        print("=" * 50)
        
        errors = []
        warnings = []
        info = []
        
        for log in logs:
            level = log['level']
            message = log['message']
            
            if level == 'SEVERE':
                errors.append(message)
                print(f"❌ ERROR: {message}")
            elif level == 'WARNING':
                warnings.append(message)
                print(f"⚠️  WARNING: {message}")
            else:
                info.append(message)
                print(f"ℹ️  INFO: {message}")
        
        print("=" * 50)
        print(f"📈 Summary:")
        print(f"   Errors: {len(errors)}")
        print(f"   Warnings: {len(warnings)}")
        print(f"   Info messages: {len(info)}")
        
        if errors:
            print(f"\n🚨 CRITICAL: Found {len(errors)} console errors!")
            return False
        elif warnings:
            print(f"\n⚠️  CAUTION: Found {len(warnings)} warnings")
            return True
        else:
            print(f"\n✅ SUCCESS: No console errors found!")
            return True
            
    except Exception as e:
        print(f"❌ Error checking console: {e}")
        return False
    finally:
        try:
            driver.quit()
        except:
            pass

if __name__ == "__main__":
    success = check_console_errors()
    exit(0 if success else 1) 