
/**
 * THE VERIFICATION GATE (Step 4D)
 * A product is READY only if ALL pass:
 * - image_url exists
 * - HEAD 200
 * - Content-Type = image/*
 * - product_url exists
 * - HTTP 200
 */
export async function verifyProductUrls(imageUrl: string | null, productUrl: string | null): Promise<boolean> {
  if (!imageUrl || !productUrl) return false;

  try {
    const checkUrl = async (url: string, isImage: boolean): Promise<boolean> => {
      try {
        // Standard fetch to verify connectivity and headers.
        // Note: Luxury domains often require specific headers or server-side proxies to bypass CORS.
        // In this execution environment, we strictly skip items that do not return 200 OK.
        const response = await fetch(url, { method: 'HEAD' });
        
        if (response.status !== 200) return false;

        if (isImage) {
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.startsWith('image/')) {
            return false;
          }
        }

        return true;
      } catch (e) {
        // Step 4D: Fail any -> SKIPPED. No placeholders allowed.
        return false;
      }
    };

    // Parallel verification for throughput
    const [imgOk, pageOk] = await Promise.all([
      checkUrl(imageUrl, true),
      checkUrl(productUrl, false)
    ]);

    return imgOk && pageOk;
  } catch {
    return false;
  }
}
