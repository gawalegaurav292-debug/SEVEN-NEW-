import random

# 🎯 Smart scoring system for outfits

def score_item(item, preferences):
    score = 0

    # Color match
    if preferences.get("color") and preferences["color"].lower() in item["name"].lower():
        score += 2

    # Budget fit
    if item["price"] <= preferences.get("budget", 100):
        score += 2

    # Style keyword match
    if preferences.get("style") and preferences["style"].lower() in item["name"].lower():
        score += 1

    return score


def select_best(items, preferences):
    if not items:
        return None

    scored = [(item, score_item(item, preferences)) for item in items]
    scored.sort(key=lambda x: x[1], reverse=True)

    # Return best item
    return scored[0][0]
