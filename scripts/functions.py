import random

# List of positive adjectives
positive_adjectives = [
    "cheerful", "joyful", "jolly", "ecstatic", "gleeful", "elated", "blissful",
    "euphoric", "delighted", "content", "happy", "overjoyed", "radiant", "merry",
    "lively", "exuberant", "thrilled", "buoyant", "jubilant", "eager", "energetic",
    "enthusiastic", "excited", "exhilarated", "vibrant", "animated", "hopeful",
    "inspired", "zealous", "passionate", "serene", "tranquil", "relaxed", "peaceful",
    "composed", "soothed", "mellow", "harmonious", "gentle", "restful", "affectionate",
    "caring", "compassionate", "tender", "warmhearted", "devoted", "loving", "adoring",
    "sweet"
]
# List of animal names
animal_names = [
    "lion", "tiger", "elephant", "giraffe", "zebra", "kangaroo", "panda",
    "wolf", "fox", "rabbit", "deer", "dolphin", "eagle", "parrot", "falcon",
    "bear", "cheetah", "crocodile", "flamingo", "leopard", "octopus", "penguin",
    "raccoon", "shark", "squirrel", "turtle", "whale", "owl", "buffalo", "otter"
]

def generate_namespace():
    """Generates a random namespace using an adjective and a noun."""
    word1 = random.choice(positive_adjectives)
    word2 = random.choice(animal_names)

    return f"{word1}-{word2}"

