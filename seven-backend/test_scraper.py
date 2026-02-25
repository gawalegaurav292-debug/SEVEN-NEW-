import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "app"))

from scrapers.sites.hm_scraper import HMScraper


async def main():
    scraper = HMScraper(headless=False)

    results = await scraper.search("white t-shirt", 5)

    print("\n====================")
    print("Products found:", len(results))
    print("====================")

    for r in results:
        print(r)


if __name__ == "__main__":
    asyncio.run(main())