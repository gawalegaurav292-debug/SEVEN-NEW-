import sys
import os
sys.path.append(os.path.abspath(","))

import asyncio
from app.scrapers.sites.hm_scraper import HMScraper

async def main():
    scraper = HMScraper()
    results = await scraper.search("white t-shirt", 5)

    print("\nRESULTS:\n")
    for r in results:
        print(r)

asyncio.run(main())