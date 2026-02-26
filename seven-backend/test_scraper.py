import asyncio
from app.scraper.sites.hm_scraper import HMScraper


async def main():
    scraper = HMScraper()
    results = await scraper.search("white t-shirt", 5)

    print("\nTEST RESULTS:\n")
    for r in results:
        print(r)


if __name__ == "__main__":
    asyncio.run(main())