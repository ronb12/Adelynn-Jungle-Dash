from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
import time

chrome_options = Options()
# chrome_options.add_argument("--headless=new")  # Commented out to show browser window
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--window-size=480,800")
chrome_options.add_argument("--no-sandbox")

driver = webdriver.Chrome(options=chrome_options)

try:
    driver.get("http://localhost:8000")
    time.sleep(2)  # Wait for the game to load

    # Click the canvas to focus (optional, but helps)
    canvas = driver.find_element(By.ID, "gameCanvas")
    driver.execute_script("arguments[0].scrollIntoView();", canvas)
    play_btn = driver.find_element(By.ID, "playBtn")
    play_btn.click()
    time.sleep(1)  # Wait for menu to appear
    menu_start_btn = driver.find_element(By.ID, "menuStartBtn")
    menu_start_btn.click()
    time.sleep(1)  # Wait for overlays to be removed
    canvas.click()
    time.sleep(0.5)

    # Send keys to the BODY element (document-level listeners)
    body = driver.find_element(By.TAG_NAME, "body")
    body.send_keys(Keys.SPACE)
    time.sleep(1)

    for _ in range(5):
        body.send_keys(Keys.ARROW_LEFT)
        time.sleep(0.5)
        body.send_keys(Keys.ARROW_RIGHT)
        time.sleep(0.5)
        body.send_keys(Keys.ARROW_UP)
        time.sleep(0.5)

    time.sleep(5)
finally:
    driver.quit() 