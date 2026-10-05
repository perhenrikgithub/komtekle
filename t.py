
# for all characters in src/data/characters.json, look for their image in public/character_images, their file names are "name" but all lowercase and without spaces, and with .jpg extention. If no image is found, print "name" has no image. If an image that does not have a chorsponding character is found, print that aswell. format of the json file:
# [
#     {
#         "name": "Aksel Wilhelmsen",
#         "gender": "Male",
#         "role": [
#             "Student",
#             "5th"
#         ],
#         "height": "Litt kortere enn menneskehøyde",
#         "certified mojavebabe": "Nei",
#         "verv-whipped": "Ja",
#         "region": "Øst"
#     },
#     {
#         "name": "Aleksander",
#         "gender": "Male",
#         "role": [
#             "Student",
#             "5th"
#         ],
#         "height": "Litt kortere enn menneskehøyde",
#         "certified mojavebabe": "Nei",
#         "verv-whipped": "Nei",
#         "region": "Øst"
#     },

import json
import os

# const getImagePath = (name) => {
#   // Strips out spaces, parentheses, slashes, etc.
#   const cleanName = name.toLowerCase().replace(/[^a-z0-9æøå]/gi, '');
#   return `/character_images/${cleanName}.jpg`;
# };

def get_image_path(name):
    # Strips out spaces, parentheses, slashes, etc.
    clean_name = ''.join(c for c in name.lower() if c.isalnum() or c in 'æøå')
    return f'public/character_images/{clean_name}.jpg'

CHAR_WITHOUT_IMAGE = False
IMAGE_WITHOUT_CHAR = False
EQUAL_USERS = True

with open('src/data/characters.json') as f:
    characters = json.load(f)

    if not os.path.exists('public/character_images'):
        print("Directory 'public/character_images' does not exist.")
        exit(1)

    if CHAR_WITHOUT_IMAGE:
        print("Checking for characters without images...")
        for character in characters:
            image_path = get_image_path(character['name'])
            if not os.path.exists(image_path):
                print(f"{character['name']} has no image.")

        print("--------------------")
    if IMAGE_WITHOUT_CHAR:
        print("Checking for images without corresponding characters...")
        for image in os.listdir('public/character_images'):
            name = os.path.splitext(image)[0]
            if not any(character['name'].lower().replace(' ', '') == name for character in characters):
                print(f"{image} has no corresponding character.")

    if EQUAL_USERS:
        print("Checking for equal users...")
        # ifnoring names, create groups of characters with the rest of the params equal (goal is all charachters unique excluding name)
        # find groups of non-unique characters, print group names + group params
        unique_chars = {}
        for character in characters:
            key = (character['gender'], tuple(character['role']), character['height'], character['certified mojavebabe'], character['verv-whipped'], character['region'], character.get('profil', None))
            if key not in unique_chars:
                unique_chars[key] = []
            unique_chars[key].append(character['name'])

        for key, names in unique_chars.items():
            if len(names) > 1:
                print(f"{len(names)} characters with parameters: {key}")
                for name in names:
                    print(f" - {name}")
                print("")

        
