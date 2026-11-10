# Poprawione ilustracje mapy

Tryb: wbudowane narzędzie imagegen, nowe obrazki na podstawie stylu ilustracji źródłowych. Wszystkie trzy pliki mają kanał przezroczystości, pełny obrys i margines. Oryginalne mapy i folder `szablony` nie były modyfikowane. Interfejs nakłada obrazki na uszkodzone dekoracje, zachowując trasę i punkty.

Pliki wynikowe:

- `dist/assets/pacifier.png` — pełny smoczek, z zamkniętym dolnym uchwytem.
- `dist/assets/bear.png` — pełny miś, z obiema stopami.
- `dist/assets/onesie.png` — pełne body, z wycięciami na nogi i napami.

Obrazki płci dziecka są rysowane jako SVG w `dist/avatars.js`: chłopiec, dziewczynka i nieoznaczono.

## Prompt smoczka

Use case: stylized-concept. Asset type: small decorative pacifier icon in a mobile parenting app. Input image is STYLE REFERENCE ONLY: extract the visual design language of the pacifier shown near the left edge. Generate ONE isolated full pacifier, with an amber yellow nipple, turquoise blue shield and purple loop handle. Soft rounded cheerful polished cartoon icon, subtle glossy highlights, white rim, same slight diagonal tilt as reference. The whole purple ring must be complete and uncut, including its bottom curve. Genuine transparent background, square canvas, centered object with generous transparent padding on every side. No other objects, no text, no map, no numbers, no border, no watermark. Intended rendering size about 80px.

## Prompt misia

Use case: stylized-concept. Asset type: mobile parenting map decorative icon. Reference image is STYLE REFERENCE ONLY. Recreate ONLY the little caramel teddy bear on the right: rounded seated friendly brown plush bear, white heart on belly, pale muzzle and inner ears, warm orange paws, polished soft cartoon illustration with subtle highlights and a fine white rim. Entire bear must be present, including both complete rounded feet and bottom silhouette, never cut by a straight edge. One isolated teddy centered on transparent square canvas, ample transparent padding. No text, no map, no numbers, no other objects.

## Prompt body

Use case: stylized-concept. Asset type: mobile parenting map decorative icon. Reference image is STYLE REFERENCE ONLY. Recreate ONLY the small bright yellow baby bodysuit shown at the upper left. Cute yellow short-sleeved baby onesie with a white heart in the middle, soft glossy rounded cartoon style, fine white rim, slightly tilted. Show the FULL bodysuit with both rounded leg openings and the closed rounded crotch with tiny snaps, an intact lower silhouette. One isolated object centered on a transparent square canvas with ample transparent padding. No text, no map, no numbers, no other objects.
