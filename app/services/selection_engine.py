# selection_engine.py
# Adds intelligent outfit selection instead of random first pick

from itertools import product


def score_outfit(top, bottom, shoes):
    score = 0

    # Basic color matching (very simple heuristic)
    if any(c in top['name'].lower() for c in ['white','black','blue']):
        score += 1
    if any(c in bottom['name'].lower() for c in ['black','blue','grey']):
        score += 1
    if any(c in shoes['name'].lower() for c in ['white','black']):
        score += 1

    # Style consistency (basic keyword match)
    if 'jeans' in bottom['name'].lower() and 't-shirt' in top['name'].lower():
        score += 1

    return score


def select_best_outfit(tops, bottoms, shoes_list):
    best = None
    best_score = -1

    for t, b, s in product(tops, bottoms, shoes_list):
        score = score_outfit(t, b, s)
        if score > best_score:
            best_score = score
            best = (t, b, s)

    return best if best else (tops[0], bottoms[0], shoes_list[0])
