class MatchingEngine:
    """
    SÉVEN Core IP: The Decision Logic
    Scores combinations based on color harmony, occasion fit, and budget alignment.
    """

    def __init__(self):
        self.weights = {'color': 0.4, 'occasion': 0.4, 'budget': 0.2}

    def select_best(self, products, intent):
        tops = [p for p in products if p.get('category') == 'top']
        bottoms = [p for p in products if p.get('category') == 'bottom']
        shoes = [p for p in products if p.get('category') == 'shoes']

        best_score = -1
        best_outfit = None

        for t in tops:
            for b in bottoms:
                for s in shoes:
                    score = self._calculate(t, b, s, intent)
                    if score > best_score:
                        best_score = score
                        best_outfit = {
                            'primary_look': [t, b, s],
                            'total_price': sum([item.get('price', 0) for item in [t, b, s]]),
                            'confidence': score
                        }
        return best_outfit

    def _calculate(self, t, b, s, intent):
        color_score = 1.0 if t.get('color') == b.get('color') else 0.6
        occ_score = 1.0 if t.get('vibe') == intent.get('style') else 0.7

        total = sum([i.get('price', 0) for i in [t, b, s]])
        budget_score = 1.0 if total <= intent.get('budget', 150) else 0.0

        return (color_score * self.weights['color']) + \
               (occ_score * self.weights['occasion']) + \
               (budget_score * self.weights['budget'])
