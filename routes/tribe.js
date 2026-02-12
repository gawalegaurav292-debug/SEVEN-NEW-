import express from 'express';
const router = express.Router();

// Mock Database for Community Outfits
const communityOutfits = [
  { id: 't1', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', user: 'alex_style', fire: 120, trash: 5 },
  { id: 't2', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80', user: 'jordan_f', fire: 85, trash: 12 },
  { id: 't3', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80', user: 'fashion_k', fire: 200, trash: 2 },
  { id: 't4', image: 'https://images.unsplash.com/photo-1550614000-4b951987965a?auto=format&fit=crop&w=800&q=80', user: 'urban_nomad', fire: 45, trash: 40 }
];

router.get('/feed', (req, res) => {
  res.json({ outfits: communityOutfits });
});

router.post('/vote', (req, res) => {
  const { outfitId, vote } = req.body;
  const outfit = communityOutfits.find(o => o.id === outfitId);
  if (outfit) {
    if (vote === 'fire') outfit.fire++;
    if (vote === 'trash') outfit.trash++;
  }
  res.json({ success: true, stats: { fire: outfit?.fire, trash: outfit?.trash } });
});

export default router;